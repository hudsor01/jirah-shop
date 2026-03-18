"use client";

import { useActionState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { subscribeToNewsletter } from "@/actions/newsletter";
import type { ActionResult } from "@/lib/action-result";

export function NewsletterForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult<void> | null, formData: FormData) => {
      return await subscribeToNewsletter(formData);
    },
    null
  );

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(
        "You're subscribed! Welcome to the Jirah Shop community."
      );
      formRef.current?.reset();
    } else {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      className="mx-auto mt-6 flex max-w-sm gap-3"
      action={formAction}
    >
      <Input
        type="email"
        name="email"
        placeholder="Your email address"
        className="flex-1"
        required
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            <span className="sr-only">Subscribing...</span>
          </>
        ) : (
          "Subscribe"
        )}
      </Button>
    </form>
  );
}
