import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEvent } from "@/components/event-context";
import { resetSavedEvent } from "@/hooks/use-saved-event";

/** On sign-out, drop back to the Meridian sample and forget the saved link. */
export function SignOutReset() {
  const { reset, setRunSheet } = useEvent();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_OUT") return;
      reset();
      setRunSheet(null);
      resetSavedEvent();
    });
    return () => data.subscription.unsubscribe();
  }, [reset, setRunSheet]);
  return null;
}
