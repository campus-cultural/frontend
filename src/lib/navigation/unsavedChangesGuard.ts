type ContinueNavigation = () => void;
type UnsavedChangesHandler = (continueNavigation: ContinueNavigation) => boolean;

let activeHandler: UnsavedChangesHandler | null = null;

export function setUnsavedChangesHandler(handler: UnsavedChangesHandler) {
  activeHandler = handler;

  return () => {
    if (activeHandler === handler) {
      activeHandler = null;
    }
  };
}

export function runWithUnsavedChangesGuard(continueNavigation: ContinueNavigation) {
  if (!activeHandler) {
    continueNavigation();
    return false;
  }

  return activeHandler(continueNavigation);
}
