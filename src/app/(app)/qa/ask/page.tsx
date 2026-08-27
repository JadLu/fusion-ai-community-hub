import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { AskQuestionForm } from "@/components/qa/ask-question-form";

export const metadata: Metadata = { title: "Ask a Question" };

export default function AskQuestionPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Ask a question" description="The community usually replies within a day." />
      <Suspense>
        <AskQuestionForm />
      </Suspense>
    </div>
  );
}
