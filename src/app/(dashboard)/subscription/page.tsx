import { Suspense } from 'react';
import SubscriptionClientPage from './SubscriptionClientPage';

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SubscriptionClientPage />
    </Suspense>
  );
}
