
import { getGroup } from '@/lib/group-utils';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { groupId: string } }): Promise<Metadata> {
  const group = await getGroup(params.groupId);
  return {
    title: `Shelfy - ${group.name}`,
  };
}

export default async function GroupDetailsPage({ params }: { params: { groupId: string } }) {
  const group = await getGroup(params.groupId);

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">{group.name}</h1>
      <p className="text-lg text-gray-600">{group.description}</p>
    </div>
  );
}
