create table public.categorias (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  cor text not null default '#64748b'
);

create table public.lancamentos (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('receita', 'despesa')),
  descricao text not null,
  valor numeric(12,2) not null check (valor > 0),
  data_competencia date not null,
  data_vencimento date not null,
  data_pagamento date,
  status text not null default 'pendente' check (status in ('pendente', 'pago')),
  recorrencia text not null default 'variavel' check (recorrencia in ('fixa', 'variavel')),
  parcela_atual int not null default 1 check (parcela_atual >= 1),
  total_parcelas int not null default 1 check (total_parcelas >= 1),
  grupo_parcelas bigint,
  categoria_id bigint references public.categorias(id) on delete restrict,
  observacao text,
  created_at timestamptz not null default now(),
  check (parcela_atual <= total_parcelas)
);

create index categorias_user_id_idx on public.categorias (user_id);
create index lancamentos_user_id_idx on public.lancamentos (user_id);
create index lancamentos_data_vencimento_idx on public.lancamentos (user_id, data_vencimento);
create index lancamentos_status_idx on public.lancamentos (user_id, status);
create index lancamentos_grupo_parcelas_idx on public.lancamentos (grupo_parcelas);
create index lancamentos_categoria_id_idx on public.lancamentos (categoria_id);

alter table public.categorias enable row level security;
alter table public.lancamentos enable row level security;

create policy "categorias_owner" on public.categorias
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "lancamentos_owner" on public.lancamentos
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create function public.criar_categorias_padrao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categorias (user_id, nome, tipo, cor) values
    (new.id, 'Salário', 'receita', '#16a34a'),
    (new.id, 'Freelance', 'receita', '#0d9488'),
    (new.id, 'Investimentos', 'receita', '#2563eb'),
    (new.id, 'Outras receitas', 'receita', '#64748b'),
    (new.id, 'Moradia', 'despesa', '#dc2626'),
    (new.id, 'Alimentação', 'despesa', '#ea580c'),
    (new.id, 'Transporte', 'despesa', '#ca8a04'),
    (new.id, 'Saúde', 'despesa', '#db2777'),
    (new.id, 'Educação', 'despesa', '#7c3aed'),
    (new.id, 'Lazer', 'despesa', '#0891b2'),
    (new.id, 'Assinaturas', 'despesa', '#4f46e5'),
    (new.id, 'Outras despesas', 'despesa', '#64748b');
  return new;
end;
$$;

revoke execute on function public.criar_categorias_padrao() from public, anon, authenticated;

create trigger on_auth_user_created_categorias
  after insert on auth.users
  for each row execute function public.criar_categorias_padrao();

create function public.resumo_dashboard(p_mes date)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with m as (select date_trunc('month', p_mes)::date as ini)
  select jsonb_build_object(
    'receitas', (
      select coalesce(sum(l.valor), 0) from public.lancamentos l, m
      where l.tipo = 'receita'
        and l.data_vencimento >= m.ini and l.data_vencimento < m.ini + interval '1 month'
    ),
    'despesas', (
      select coalesce(sum(l.valor), 0) from public.lancamentos l, m
      where l.tipo = 'despesa'
        and l.data_vencimento >= m.ini and l.data_vencimento < m.ini + interval '1 month'
    ),
    'a_pagar', (
      select coalesce(sum(l.valor), 0) from public.lancamentos l, m
      where l.tipo = 'despesa' and l.status = 'pendente'
        and l.data_vencimento >= m.ini and l.data_vencimento < m.ini + interval '1 month'
    ),
    'saldo_atual', (
      select coalesce(sum(case when tipo = 'receita' then valor else -valor end), 0)
      from public.lancamentos where status = 'pago'
    ),
    'categorias', (
      select coalesce(jsonb_agg(x order by x.total desc), '[]'::jsonb)
      from (
        select coalesce(c.nome, 'Sem categoria') as nome,
               coalesce(c.cor, '#64748b') as cor,
               sum(l.valor) as total
        from public.lancamentos l
        left join public.categorias c on c.id = l.categoria_id
        cross join m
        where l.tipo = 'despesa'
          and l.data_vencimento >= m.ini and l.data_vencimento < m.ini + interval '1 month'
        group by c.nome, c.cor
      ) x
    ),
    'meses', (
      select jsonb_agg(
        jsonb_build_object(
          'mes', to_char(g.mes, 'YYYY-MM'),
          'receitas', coalesce((
            select sum(l.valor) from public.lancamentos l
            where l.tipo = 'receita'
              and l.data_vencimento >= g.mes and l.data_vencimento < g.mes + interval '1 month'
          ), 0),
          'despesas', coalesce((
            select sum(l.valor) from public.lancamentos l
            where l.tipo = 'despesa'
              and l.data_vencimento >= g.mes and l.data_vencimento < g.mes + interval '1 month'
          ), 0)
        ) order by g.mes
      )
      from m, generate_series(m.ini - interval '5 months', m.ini::timestamp, interval '1 month') as g(mes)
    )
  );
$$;

revoke execute on function public.resumo_dashboard(date) from public, anon;
grant execute on function public.resumo_dashboard(date) to authenticated;

create view public.categorias_resumo
with (security_invoker = true) as
select
  c.id,
  c.user_id,
  c.nome,
  c.tipo,
  c.cor,
  count(l.id)::int as qtd_lancamentos
from public.categorias c
left join public.lancamentos l on l.categoria_id = c.id
group by c.id;

create sequence public.lancamentos_grupo_seq;
grant usage on sequence public.lancamentos_grupo_seq to authenticated;

create function public.criar_lancamentos(p_linhas jsonb, p_agrupar boolean default false)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_grupo bigint := case when p_agrupar then nextval('public.lancamentos_grupo_seq') end;
begin
  insert into public.lancamentos (
    user_id, tipo, descricao, valor, data_competencia, data_vencimento, recorrencia,
    parcela_atual, total_parcelas, grupo_parcelas, categoria_id, observacao
  )
  select
    (select auth.uid()), l.tipo, l.descricao, l.valor, l.data_vencimento, l.data_vencimento, l.recorrencia,
    l.parcela_atual, l.total_parcelas, v_grupo, l.categoria_id, l.observacao
  from jsonb_to_recordset(p_linhas) as l(
    tipo text, descricao text, valor numeric, data_vencimento date, recorrencia text,
    parcela_atual int, total_parcelas int, categoria_id bigint, observacao text
  );
end;
$$;

revoke execute on function public.criar_lancamentos(jsonb, boolean) from public, anon;
grant execute on function public.criar_lancamentos(jsonb, boolean) to authenticated;
