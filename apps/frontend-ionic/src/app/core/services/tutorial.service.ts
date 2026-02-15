import { Injectable, signal, computed } from "@angular/core";

export interface TutorialStep {
  id: string;
  target: string | null;
  action: "next" | "click";
  tooltipPosition: "top" | "bottom" | "center";
  waitForState?: string;
}

@Injectable({ providedIn: "root" })
export class TutorialService {
  active = signal(false);
  currentStepIndex = signal(0);
  subStep = signal<"main" | "waiting">("main");

  readonly steps: TutorialStep[] = [
    {
      id: "welcome",
      target: null,
      action: "next",
      tooltipPosition: "center",
    },
    {
      id: "theme",
      target: '[data-tutorial="theme-btn"]',
      action: "click",
      tooltipPosition: "bottom",
      waitForState: "IDLE",
    },
    {
      id: "add-object",
      target: '[data-tutorial="fab-add"]',
      action: "click",
      tooltipPosition: "top",
      waitForState: "IDLE",
    },
    {
      id: "move",
      target: '[data-tutorial="canvas"]',
      action: "next",
      tooltipPosition: "bottom",
    },
    {
      id: "share",
      target: '[data-tutorial="share-pill"]',
      action: "click",
      tooltipPosition: "top",
      waitForState: "IDLE",
    },
  ];

  currentStep = computed(() => this.steps[this.currentStepIndex()]);

  startTutorial(): void {
    this.currentStepIndex.set(0);
    this.subStep.set("main");
    this.active.set(true);
  }

  nextStep(): void {
    const next = this.currentStepIndex() + 1;
    if (next >= this.steps.length) {
      this.completeTutorial();
    } else {
      this.currentStepIndex.set(next);
      this.subStep.set("main");
    }
  }

  enterWaiting(): void {
    this.subStep.set("waiting");
  }

  completeTutorial(): void {
    this.active.set(false);
    this.markCompleted();
  }

  skipTutorial(): void {
    this.active.set(false);
    this.markCompleted();
  }

  async hasCompleted(): Promise<boolean> {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key: "tutorial_completed" });
      return value === "true";
    } catch {
      return localStorage.getItem("tutorial_completed") === "true";
    }
  }

  private async markCompleted(): Promise<void> {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({ key: "tutorial_completed", value: "true" });
    } catch {
      localStorage.setItem("tutorial_completed", "true");
    }
  }

  async resetCompletion(): Promise<void> {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.remove({ key: "tutorial_completed" });
    } catch {
      localStorage.removeItem("tutorial_completed");
    }
  }
}
