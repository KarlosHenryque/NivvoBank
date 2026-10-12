import { Button } from "@/components/ui/button";
import { sair } from "@/app/(auth)/actions";

export function SairButton() {
  return (
    <form action={sair}>
      <Button type="submit" variant="outline">
        Sair
      </Button>
    </form>
  );
}
