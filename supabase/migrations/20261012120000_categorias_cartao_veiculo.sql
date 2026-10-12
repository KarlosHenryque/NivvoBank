create temporary table _paleta (nome text, tipo text, cor_antiga text, cor text);
insert into _paleta values
  ('Salário', 'receita', '#16a34a', '#22c55e'),
  ('Freelance', 'receita', '#0d9488', '#06b6d4'),
  ('Investimentos', 'receita', '#2563eb', '#3b82f6'),
  ('Outras receitas', 'receita', '#64748b', '#64748b'),
  ('Moradia', 'despesa', '#dc2626', '#ef4444'),
  ('Alimentação', 'despesa', '#ea580c', '#f97316'),
  ('Transporte', 'despesa', '#ca8a04', '#eab308'),
  ('Saúde', 'despesa', '#db2777', '#ec4899'),
  ('Educação', 'despesa', '#7c3aed', '#8b5cf6'),
  ('Lazer', 'despesa', '#0891b2', '#14b8a6'),
  ('Assinaturas', 'despesa', '#4f46e5', '#3b82f6'),
  ('Outras despesas', 'despesa', '#64748b', '#64748b');

update public.categorias c
set cor = p.cor
from _paleta p
where c.nome = p.nome and c.tipo = p.tipo and c.cor = p.cor_antiga;

drop table _paleta;

insert into public.categorias (user_id, nome, tipo, cor)
select u.id, n.nome, 'despesa', n.cor
from auth.users u
cross join (values ('Cartão', '#d946ef'), ('Veículo', '#84cc16')) as n(nome, cor)
where not exists (
  select 1 from public.categorias c
  where c.user_id = u.id and c.tipo = 'despesa' and lower(c.nome) = lower(n.nome)
);

create or replace function public.criar_categorias_padrao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categorias (user_id, nome, tipo, cor) values
    (new.id, 'Salário', 'receita', '#22c55e'),
    (new.id, 'Freelance', 'receita', '#06b6d4'),
    (new.id, 'Investimentos', 'receita', '#3b82f6'),
    (new.id, 'Outras receitas', 'receita', '#64748b'),
    (new.id, 'Moradia', 'despesa', '#ef4444'),
    (new.id, 'Alimentação', 'despesa', '#f97316'),
    (new.id, 'Transporte', 'despesa', '#eab308'),
    (new.id, 'Veículo', 'despesa', '#84cc16'),
    (new.id, 'Cartão', 'despesa', '#d946ef'),
    (new.id, 'Saúde', 'despesa', '#ec4899'),
    (new.id, 'Educação', 'despesa', '#8b5cf6'),
    (new.id, 'Lazer', 'despesa', '#14b8a6'),
    (new.id, 'Assinaturas', 'despesa', '#3b82f6'),
    (new.id, 'Outras despesas', 'despesa', '#64748b');
  return new;
end;
$$;

create or replace function public.resumo_dashboard(p_mes date)
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
      from public.lancamentos
      where (tipo = 'despesa' and status = 'pago')
         or (tipo = 'receita' and (status = 'pago'
             or data_vencimento <= (now() at time zone 'America/Sao_Paulo')::date))
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
