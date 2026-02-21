"use client";

import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewsletterForm() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    form.reset();
    toast.success(
      "You're subscribed! Welcome to the Jirah Shop community."
    );
  }

  return (
    <form
      className="mx-auto mt-6 flex max-w-sm gap-3"
      onSubmit={handleSubmit}
    >
      <Input
        type="email"
        placeholder="Your email address"
        className="flex-1"
        required
      />
      <Button type="submit">Subscribe</Button>
    </form>
  );
}
