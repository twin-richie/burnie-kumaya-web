import { Suspense } from "react";

import { TasksPageClient } from "@/components/planning/task-page-client";
import { loadDatastore } from "@/lib/data";

export const metadata = { title: "Tasks · Burnie / Kumaya Planning Hub" };

export default async function TasksPage() {
  const datastore = await loadDatastore();

  return (
    <Suspense fallback={null}>
      <TasksPageClient datastore={datastore} />
    </Suspense>
  );
}
