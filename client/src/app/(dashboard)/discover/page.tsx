
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DiscoverPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Découvrir</h1>
        <p className="text-gray-600">Explorez de nouveaux genres et trouvez votre prochaine lecture.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>En cours de développement</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Cette fonctionnalité est en cours de construction. Revenez bientôt !</p>
        </CardContent>
      </Card>
    </div>
  );
}
