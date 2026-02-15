import {
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import {
  IonContent,
  IonIcon,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonModal,
  IonAlert,
} from "@ionic/angular/standalone";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { NgtCanvas } from "angular-three/dom";
import { addIcons } from "ionicons";
import {
  addOutline,
  trashOutline,
  refreshOutline,
  moveOutline,
  shareOutline,
  imageOutline,
} from "ionicons/icons";

import { RoomService } from "@app/core/services/room.service";
import { TrophyService } from "@app/core/services/trophy.service";
import {
  ThemeService,
  type ThemeSnapshot,
} from "@app/core/services/theme.service";
import { TokenService } from "@app/core/services/token.service";
import { ShareService } from "@app/core/services/share.service";
import { ScreenshotService } from "@app/core/services/screenshot.service";
import { UploadService } from "@app/core/services/upload.service";
import { DecorationService } from "@app/core/services/decoration.service";
import { FrameService } from "@app/core/services/frame.service";
import {
  type RoomTheme,
  type CustomThemeColors,
  type MaterialOverrides,
  CUSTOM_THEME_ID,
} from "@app/types/room-theme";

import {
  PainCaveSceneComponent,
  type ItemDragEvent,
} from "../components/pain-cave-scene/pain-cave-scene.component";
import { EditorToolbarComponent } from "../components/editor-toolbar/editor-toolbar.component";
import { ContextActionBarComponent } from "../components/context-action-bar/context-action-bar.component";
import {
  FloorPlacementPanelComponent,
  type FloorPlacementValues,
} from "../components/floor-placement-panel/floor-placement-panel.component";
import { ThemeSelectorSheetComponent } from "../components/theme-selector-sheet/theme-selector-sheet.component";
import { CustomThemeEditorComponent } from "../components/custom-theme-editor/custom-theme-editor.component";
import { ObjectCatalogSheetComponent } from "../components/object-catalog-sheet/object-catalog-sheet.component";
import { ShareRoomSheetComponent } from "../components/share-room-sheet/share-room-sheet.component";
import {
  WallPlacementPanelComponent,
  type WallPlacementValues,
} from "../components/wall-placement-panel/wall-placement-panel.component";
import { MaterialCustomizerSheetComponent } from "../components/material-customizer-sheet/material-customizer-sheet.component";
import { FrameImagePickerSheetComponent } from "../components/frame-image-picker-sheet/frame-image-picker-sheet.component";
import { TutorialOverlayComponent } from "@app/shared/components/tutorial-overlay/tutorial-overlay.component";
import { TutorialService } from "@app/core/services/tutorial.service";

// ─── Editor State Machine ────────────────────────────────
type EditorState =
  | { kind: "IDLE" }
  | { kind: "SELECTED"; itemId: string }
  | { kind: "DRAGGING"; itemId: string }
  | { kind: "CATALOG_OPEN" }
  | { kind: "SLOT_PICKING"; itemToPlace: string; source: "catalog" | "move" }
  | { kind: "THEME_OPEN" }
  | { kind: "CUSTOM_EDITOR_OPEN" }
  | { kind: "MATERIAL_EDITOR_OPEN" }
  | { kind: "SHARE_OPEN" }
  | { kind: "CONFIRM_DELETE"; itemId: string }
  | { kind: "FRAME_IMAGE_PICKER"; roomItemId: string };

@Component({
  selector: "app-room-edit",
  standalone: true,
  imports: [
    TranslateModule,
    NgtCanvas,
    PainCaveSceneComponent,
    EditorToolbarComponent,
    ContextActionBarComponent,
    FloorPlacementPanelComponent,
    ThemeSelectorSheetComponent,
    CustomThemeEditorComponent,
    ObjectCatalogSheetComponent,
    ShareRoomSheetComponent,
    WallPlacementPanelComponent,
    MaterialCustomizerSheetComponent,
    FrameImagePickerSheetComponent,
    TutorialOverlayComponent,
    IonContent,
    IonIcon,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonModal,
    IonAlert,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-content [fullscreen]="true">
      <div class="editor-layout">
        <!-- Floating toolbar overlay -->
        <app-editor-toolbar (openThemes)="openThemeSelector()" />

        <!-- Loading overlay (non-destructive — canvas stays alive) -->
        @if (roomService.loading()) {
        <div class="loading-overlay">
          <ion-spinner name="crescent" />
        </div>
        }

        <!-- 3D Canvas -->
        <div class="canvas-section" data-tutorial="canvas">
          <ngt-canvas
            [shadows]="true"
            [dpr]="[1, 2]"
            [camera]="{ position: [5, 5, 5], fov: 45 }"
          >
            <app-pain-cave-scene
              *canvasContent
              [items]="roomService.room()?.items ?? []"
              [editable]="true"
              [selectedItemId]="selectedItemId()"
              [theme]="themeService.activeTheme()"
              [zoomOut]="state().kind === 'MATERIAL_EDITOR_OPEN'"
              [freeMovement]="freeMovement()"
              (itemPressed)="onItemPressed($event)"
              (itemDragged)="onItemDragged($event)"
              (itemDragEnd)="onItemDragEnd($event)"
            />
          </ngt-canvas>
        </div>

        <!-- Floating share pill -->
        @if (state().kind === "IDLE") {
        <button
          class="share-pill"
          data-tutorial="share-pill"
          (click)="onShare()"
        >
          <ion-icon name="share-outline" />
        </button>
        }

        <!-- Context Action Bar (shown when item selected) -->
        @if (isDecorationSelected()) {
        <app-floor-placement-panel
          [positionX]="selectedItem()?.positionX ?? 0"
          [positionY]="selectedItem()?.positionY ?? 0"
          [positionZ]="selectedItem()?.positionZ ?? 0"
          [rotationDegrees]="selectedItemRotationDeg()"
          [scale]="selectedItem()?.scaleX ?? 0.5"
          [name]="selectedItem()?.decoration?.name ?? null"
          [freeMovement]="freeMovement()"
          (changed)="onFloorPlacementChange($event)"
          (freeMovementChange)="onFreeMovementToggle($event)"
          (delete)="confirmDelete()"
        />
        } @else if (isFrameSelected()) {
        <app-wall-placement-panel
          [wall]="selectedItem()?.wall ?? 'right'"
          [positionX]="selectedItem()?.positionX ?? 0"
          [positionY]="selectedItem()?.positionY ?? 1.5"
          [positionZ]="selectedItem()?.positionZ ?? 0"
          [scale]="selectedItem()?.scaleX ?? 0.5"
          [name]="'room.frames' | translate"
          [freeMovement]="freeMovement()"
          (changed)="onWallPlacementChange($event)"
          (freeMovementChange)="onFreeMovementToggle($event)"
          (delete)="confirmDelete()"
        >
          <button class="change-image-btn" (click)="onChangeFrameImage()">
            <ion-icon name="image-outline" />
            {{ "room.changeFrameImage" | translate }}
          </button>
        </app-wall-placement-panel>
        } @else if (isTrophySelected()) {
        <app-wall-placement-panel
          [wall]="selectedItem()?.wall ?? 'left'"
          [positionX]="selectedItem()?.positionX ?? 0"
          [positionY]="selectedItem()?.positionY ?? 1.5"
          [positionZ]="selectedItem()?.positionZ ?? 0"
          [scale]="selectedItem()?.scaleX ?? 0.5"
          [name]="selectedItem()?.trophy?.raceResult?.race?.name ?? null"
          [freeMovement]="freeMovement()"
          (changed)="onWallPlacementChange($event)"
          (freeMovementChange)="onFreeMovementToggle($event)"
          (delete)="confirmDelete()"
        />
        } @else if (isItemSelected()) {
        <app-context-action-bar
          (delete)="confirmDelete()"
          (rotate)="rotateItem()"
          (move)="startMove()"
        />
        }
      </div>

      <!-- FAB: Add items -->
      @if (state().kind === "IDLE") {
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button
          data-tutorial="fab-add"
          (click)="openCatalog()"
          color="primary"
        >
          <ion-icon name="add-outline" />
        </ion-fab-button>
      </ion-fab>
      }
    </ion-content>

    <!-- Tutorial Overlay -->
    <app-tutorial-overlay />

    <!-- Theme Selector Bottom Sheet -->
    <ion-modal
      #themeModal
      [isOpen]="state().kind === 'THEME_OPEN'"
      [initialBreakpoint]="0.45"
      [breakpoints]="[0, 0.45, 0.75]"
      (didDismiss)="closeThemeSelector()"
    >
      <ng-template>
        <app-theme-selector-sheet
          [currentTheme]="themeService.activeTheme()"
          (preview)="onThemePreview($event)"
          (apply)="onThemeApply($event)"
          (openCustomEditor)="onOpenCustomEditor()"
          (openMaterialEditor)="onOpenMaterialEditor()"
        />
      </ng-template>
    </ion-modal>

    <!-- Custom Theme Editor Bottom Sheet -->
    <ion-modal
      [isOpen]="state().kind === 'CUSTOM_EDITOR_OPEN'"
      [initialBreakpoint]="0.55"
      [breakpoints]="[0, 0.55, 0.85]"
      (didDismiss)="closeCustomEditor()"
    >
      <ng-template>
        <app-custom-theme-editor
          [initialColors]="themeService.customColors()"
          (preview)="onCustomPreview($event)"
          (apply)="onCustomApply($event)"
        />
      </ng-template>
    </ion-modal>

    <!-- Material Customizer Bottom Sheet -->
    <ion-modal
      [isOpen]="state().kind === 'MATERIAL_EDITOR_OPEN'"
      [initialBreakpoint]="0.45"
      [breakpoints]="[0, 0.45, 0.75]"
      (didDismiss)="closeMaterialEditor()"
    >
      <ng-template>
        <app-material-customizer-sheet
          [initialOverrides]="themeService.materialOverrides()"
          (preview)="onMaterialPreview($event)"
          (save)="onMaterialSave($event)"
          (cancel)="onMaterialCancel()"
        />
      </ng-template>
    </ion-modal>

    <!-- Object Catalog Bottom Sheet -->
    <ion-modal
      #catalogModal
      [isOpen]="state().kind === 'CATALOG_OPEN'"
      [initialBreakpoint]="0.92"
      [breakpoints]="[0, 0.5, 0.92]"
      (didDismiss)="closeCatalog()"
    >
      <ng-template>
        <app-object-catalog-sheet
          (placeTrophy)="onPlaceTrophy($event)"
          (placeDecoration)="onPlaceDecoration($event)"
          (acquireFrame)="onAcquireFrame($event)"
          (changeFrameImage)="onChangeFrameImageFromCatalog()"
          (getTokens)="onGetTokens()"
        />
      </ng-template>
    </ion-modal>

    <!-- Share Room Bottom Sheet -->
    <ion-modal
      #shareModal
      [isOpen]="state().kind === 'SHARE_OPEN'"
      [initialBreakpoint]="0.45"
      [breakpoints]="[0, 0.45, 0.6]"
      (didDismiss)="closeShare()"
    >
      <ng-template>
        <app-share-room-sheet
          [shareLink]="shareLink()"
          [capturingScreenshot]="screenshotService.capturing()"
          (dismiss)="closeShare()"
          (shareNative)="onShareNative()"
          (shareScreenshot)="onShareScreenshot()"
        />
      </ng-template>
    </ion-modal>

    <!-- Frame Image Picker Bottom Sheet -->
    <ion-modal
      [isOpen]="state().kind === 'FRAME_IMAGE_PICKER'"
      [initialBreakpoint]="0.45"
      [breakpoints]="[0, 0.45, 0.65]"
      (didDismiss)="closeFrameImagePicker()"
    >
      <ng-template>
        @if (framePickerItemId(); as itemId) {
        <app-frame-image-picker-sheet
          [roomItemId]="itemId"
          (imagePicked)="onFrameImagePicked()"
        />
        }
      </ng-template>
    </ion-modal>

    <!-- Delete Confirmation -->
    <ion-alert
      [isOpen]="state().kind === 'CONFIRM_DELETE'"
      [header]="'room.removeItem' | translate"
      [message]="'room.removeItemMessage' | translate"
      [buttons]="deleteAlertButtons"
      (didDismiss)="cancelDelete()"
    />
  `,
  styles: `
    .loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.3);
      z-index: 10;
    }

    .editor-layout {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .canvas-section {
      flex: 1;
      min-height: 0;
      transition: flex 0.2s ease-out;

      ngt-canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
    }

    .share-pill {
      position: absolute;
      bottom: calc(var(--ion-safe-area-bottom, 0px) + 24px);
      left: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 100px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.72);
      box-shadow:
        0 2px 12px rgba(0, 0, 0, 0.10),
        0 0 0 1px rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      z-index: 100;
      transition: transform 0.18s ease, box-shadow 0.18s ease;

      &:active {
        transform: scale(0.92);
      }

      ion-icon {
        font-size: 20px;
        color: var(--ion-text-color);
      }
    }

    .change-image-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: 1px solid var(--ion-color-primary);
      border-radius: 100px;
      background: transparent;
      color: var(--ion-color-primary);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 8px;

      ion-icon {
        font-size: 16px;
      }

      &:active {
        opacity: 0.7;
      }
    }

    ion-fab-button {
      --background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.72);
      --background-activated: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.85);
      --box-shadow:
        0 2px 12px rgba(0, 0, 0, 0.10),
        0 0 0 1px rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      --border-radius: 100px;
      --color: var(--ion-text-color);
      transition: transform 0.18s ease;

      &:active {
        transform: scale(0.92);
      }
    }
  `,
})
export class RoomEditPage implements OnInit {
  // Ionic lifecycle — fires BEFORE component/canvas destruction
  ionViewWillLeave(): void {
    this.captureThumbnail();
  }
  roomService = inject(RoomService);
  themeService = inject(ThemeService);
  tokenService = inject(TokenService);
  private shareService = inject(ShareService);
  screenshotService = inject(ScreenshotService);
  private uploadService = inject(UploadService);
  private trophyService = inject(TrophyService);
  private decorationService = inject(DecorationService);
  private frameService = inject(FrameService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  tutorialService = inject(TutorialService);

  private thumbnailCaptured = false;

  // ─── State Machine ───────────────────────────────
  state = signal<EditorState>({ kind: "IDLE" });
  freeMovement = signal(false);

  isItemSelected = computed(() => this.state().kind === "SELECTED");
  selectedItemId = computed(() => {
    const s = this.state();
    if (s.kind === "SELECTED") return s.itemId;
    if (s.kind === "DRAGGING") return s.itemId;
    if (s.kind === "CONFIRM_DELETE") return s.itemId;
    return null;
  });

  selectedItem = computed(() => {
    const id = this.selectedItemId();
    if (!id) return null;
    return this.roomService.room()?.items.find((i) => i.id === id) ?? null;
  });

  isDragging = computed(() => this.state().kind === "DRAGGING");

  isDecorationSelected = computed(() => {
    const item = this.selectedItem();
    return (
      !!item?.decorationId &&
      !item.wall &&
      item?.decoration?.category !== "frame"
    );
  });

  isFrameSelected = computed(() => {
    const item = this.selectedItem();
    return !!item?.decorationId && item?.decoration?.category === "frame";
  });

  isTrophySelected = computed(() => {
    const item = this.selectedItem();
    return !!item?.trophyId && !!item.wall;
  });

  selectedItemRotationDeg = computed(() => {
    const item = this.selectedItem();
    return item ? Math.round(((item.rotationY || 0) * 180) / Math.PI) : 0;
  });

  framePickerItemId = computed(() => {
    const s = this.state();
    return s.kind === "FRAME_IMAGE_PICKER" ? s.roomItemId : null;
  });

  shareLink = signal<string | null>(null);
  private previousThemeSnapshot: ThemeSnapshot | null = null;
  private previousMaterialOverrides: MaterialOverrides | null = null;

  deleteAlertButtons = [
    { text: this.translate.instant("common.cancel"), role: "cancel" },
    {
      text: this.translate.instant("common.delete"),
      role: "destructive",
      handler: () => this.doDelete(),
    },
  ];

  constructor() {
    addIcons({
      addOutline,
      trashOutline,
      refreshOutline,
      moveOutline,
      shareOutline,
      imageOutline,
    });

    // Tutorial state watcher — advance steps based on editor state transitions
    effect(() => {
      const editorState = this.state();
      const tStep = this.tutorialService.currentStep();
      if (!this.tutorialService.active() || !tStep) return;

      // When user clicks a tutorial target and a modal opens → enter waiting mode
      if (
        tStep.action === "click" &&
        this.tutorialService.subStep() === "main"
      ) {
        if (tStep.id === "theme" && editorState.kind === "THEME_OPEN") {
          this.tutorialService.enterWaiting();
        }
        if (tStep.id === "add-object" && editorState.kind === "CATALOG_OPEN") {
          this.tutorialService.enterWaiting();
        }
        if (tStep.id === "share" && editorState.kind === "SHARE_OPEN") {
          this.tutorialService.enterWaiting();
        }
      }

      // When action completes (state returns to IDLE after modal) → advance
      if (
        tStep.waitForState === "IDLE" &&
        editorState.kind === "IDLE" &&
        this.tutorialService.subStep() === "waiting"
      ) {
        this.tutorialService.nextStep();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const room = await this.roomService.fetchMyRoom();
    if (room) {
      this.themeService.initThemeFromRoom(room);
    }
    this.trophyService.fetchTrophies();
    this.tokenService.fetchBalance();
    this.decorationService.fetchInventory();

    // Start tutorial if query param present
    const params = this.route.snapshot.queryParams;
    if (params["tutorial"] === "true") {
      this.tutorialService.startTutorial();
    }
  }

  // ─── Item Interactions ───────────────────────────
  onItemPressed(itemId: string): void {
    // Floor tap → deselect
    if (itemId === "__deselect__") {
      this.state.set({ kind: "IDLE" });
      return;
    }

    const s = this.state();
    if (s.kind === "IDLE" || s.kind === "SELECTED") {
      if (s.kind === "SELECTED" && s.itemId === itemId) {
        this.state.set({ kind: "IDLE" });
      } else {
        this.state.set({ kind: "SELECTED", itemId });
        this.hapticLight();
      }
    } else if (s.kind === "SLOT_PICKING") {
      // Clicking an item during slot picking — ignore
    }
  }

  // ─── Context Actions ─────────────────────────────
  confirmDelete(): void {
    const id = this.selectedItemId();
    if (id) {
      this.state.set({ kind: "CONFIRM_DELETE", itemId: id });
    }
  }

  cancelDelete(): void {
    const s = this.state();
    if (s.kind === "CONFIRM_DELETE") {
      this.state.set({ kind: "SELECTED", itemId: s.itemId });
    }
  }

  async doDelete(): Promise<void> {
    const s = this.state();
    if (s.kind === "CONFIRM_DELETE") {
      await this.roomService.removeItem(s.itemId);
      this.state.set({ kind: "IDLE" });
    }
  }

  async rotateItem(): Promise<void> {
    const id = this.selectedItemId();
    if (!id) return;
    const item = this.roomService.room()?.items.find((i) => i.id === id);
    if (!item) return;

    const newRotation = (item.rotationY || 0) + Math.PI / 2;
    await this.roomService.updateItem(id, {
      positionX: item.positionX,
      positionY: item.positionY,
      positionZ: item.positionZ,
      rotationY: newRotation,
    });
  }

  startMove(): void {
    const id = this.selectedItemId();
    if (!id) return;
    const slot = this.roomService.getNextSlot();
    if (slot) {
      this.roomService.updateItem(id, {
        positionX: slot.positionX,
        positionY: slot.positionY,
        positionZ: slot.positionZ,
        wall: slot.wall,
      });
    }
    this.state.set({ kind: "IDLE" });
  }

  onFreeMovementToggle(value: boolean): void {
    this.freeMovement.set(value);
  }

  async onFloorPlacementChange(values: FloorPlacementValues): Promise<void> {
    const id = this.selectedItemId();
    if (!id) return;
    const item = this.selectedItem();
    if (!item) return;
    const uniformScale = values.scale ?? item.scaleX ?? 0.5;
    await this.roomService.updateItem(id, {
      positionX: values.positionX,
      positionY: values.positionY,
      positionZ: values.positionZ,
      rotationY: values.rotationY,
      scaleX: uniformScale,
      scaleY: uniformScale,
      scaleZ: uniformScale,
    });
  }

  async onWallPlacementChange(values: WallPlacementValues): Promise<void> {
    const id = this.selectedItemId();
    if (!id) return;
    const uniformScale = values.scale ?? this.selectedItem()?.scaleX ?? 0.5;
    await this.roomService.updateItem(id, {
      positionX: values.positionX,
      positionY: values.positionY,
      positionZ: values.positionZ,
      scaleX: uniformScale,
      scaleY: uniformScale,
      scaleZ: uniformScale,
      ...(values.wall !== undefined && { wall: values.wall }),
    });
  }

  // ─── Drag ─────────────────────────────────────────
  onItemDragged(event: ItemDragEvent): void {
    // Enter DRAGGING state to hide bottom bar
    const s = this.state();
    if (s.kind === "SELECTED") {
      this.state.set({ kind: "DRAGGING", itemId: s.itemId });
      this.hapticMedium();
    }

    // Haptic feedback on wall change
    if (event.wall !== undefined) {
      this.hapticLight();
    }

    // Optimistic local update during drag (no API call)
    const room = this.roomService.room();
    if (!room) return;
    const items = room.items.map((item) => {
      if (item.id !== event.itemId) return item;
      return {
        ...item,
        positionX: event.positionX,
        ...(event.positionY !== undefined && { positionY: event.positionY }),
        positionZ: event.positionZ,
        ...(event.rotationY !== undefined && { rotationY: event.rotationY }),
        ...(event.wall !== undefined && { wall: event.wall }),
      };
    });
    this.roomService.room.set({ ...room, items });
  }

  async onItemDragEnd(event: ItemDragEvent): Promise<void> {
    // Return to SELECTED state
    const s = this.state();
    if (s.kind === "DRAGGING") {
      this.state.set({ kind: "SELECTED", itemId: s.itemId });
    }

    // Persist final position to server
    const item = this.roomService
      .room()
      ?.items.find((i) => i.id === event.itemId);
    if (!item) return;
    await this.roomService.updateItem(event.itemId, {
      positionX: event.positionX,
      positionY: event.positionY ?? item.positionY,
      positionZ: event.positionZ,
      rotationY: event.rotationY ?? item.rotationY,
      ...(event.wall !== undefined && { wall: event.wall }),
    });
  }

  // ─── Catalog ─────────────────────────────────────
  openCatalog(): void {
    this.state.set({ kind: "CATALOG_OPEN" });
  }

  closeCatalog(): void {
    if (this.state().kind === "CATALOG_OPEN") {
      this.state.set({ kind: "IDLE" });
    }
  }

  async onPlaceTrophy(trophyId: string): Promise<void> {
    await this.roomService.addItemToRoom(trophyId);
    this.state.set({ kind: "IDLE" });
    this.hapticSuccess();
  }

  async onPlaceDecoration(decorationId: string): Promise<void> {
    // Acquire if not already owned (free decorations auto-acquire)
    if (!this.decorationService.isOwned(decorationId)) {
      const acquired = await this.decorationService.acquire(decorationId);
      if (!acquired) return;
    }
    await this.roomService.addDecorationToRoom(decorationId);
    this.state.set({ kind: "IDLE" });
    this.hapticSuccess();
  }

  onGetTokens(): void {
    this.state.set({ kind: "IDLE" });
    this.router.navigate(["/tokens"]);
  }

  // ─── Frame ──────────────────────────────────────────
  async onAcquireFrame(decorationId: string): Promise<void> {
    // Acquire if not already owned
    if (!this.decorationService.isOwned(decorationId)) {
      const acquired = await this.decorationService.acquire(decorationId);
      if (!acquired) return;
    }
    const placed = await this.roomService.addFrameToRoom(decorationId);
    if (placed) {
      // Find the newly placed frame item
      const room = this.roomService.room();
      const frameItem = room?.items.find(
        (i) => i.decoration?.category === "frame"
      );
      if (frameItem) {
        this.state.set({
          kind: "FRAME_IMAGE_PICKER",
          roomItemId: frameItem.id,
        });
      } else {
        this.state.set({ kind: "IDLE" });
      }
      this.hapticSuccess();
    }
  }

  onChangeFrameImage(): void {
    const item = this.selectedItem();
    if (item) {
      this.state.set({ kind: "FRAME_IMAGE_PICKER", roomItemId: item.id });
    }
  }

  onChangeFrameImageFromCatalog(): void {
    const room = this.roomService.room();
    const frameItem = room?.items.find(
      (i) => i.decoration?.category === "frame"
    );
    if (frameItem) {
      this.state.set({ kind: "FRAME_IMAGE_PICKER", roomItemId: frameItem.id });
    }
  }

  closeFrameImagePicker(): void {
    if (this.state().kind === "FRAME_IMAGE_PICKER") {
      this.state.set({ kind: "IDLE" });
    }
  }

  onFrameImagePicked(): void {
    this.state.set({ kind: "IDLE" });
    this.hapticSuccess();
  }

  // ─── Theme Selector ──────────────────────────────
  openThemeSelector(): void {
    this.previousThemeSnapshot = this.themeService.saveSnapshot();
    this.state.set({ kind: "THEME_OPEN" });
  }

  closeThemeSelector(): void {
    // Don't reset to IDLE if we transitioned to the custom/material editor
    if (this.state().kind === "CUSTOM_EDITOR_OPEN") return;
    if (this.state().kind === "MATERIAL_EDITOR_OPEN") return;
    if (this.state().kind === "THEME_OPEN" && this.previousThemeSnapshot) {
      this.themeService.restoreSnapshot(this.previousThemeSnapshot);
    }
    this.state.set({ kind: "IDLE" });
  }

  onThemePreview(theme: RoomTheme): void {
    this.themeService.applyTheme(theme);
  }

  onThemeApply(theme: RoomTheme | null): void {
    if (theme) {
      this.themeService.applyTheme(theme);
      this.previousThemeSnapshot = null;
      this.roomService.updateRoom({ themeId: theme.id, customTheme: null });
    }
    this.state.set({ kind: "IDLE" });
  }

  // ─── Custom Theme Editor ──────────────────────────
  onOpenCustomEditor(): void {
    this.state.set({ kind: "CUSTOM_EDITOR_OPEN" });
  }

  closeCustomEditor(): void {
    if (
      this.state().kind === "CUSTOM_EDITOR_OPEN" &&
      this.previousThemeSnapshot
    ) {
      this.themeService.restoreSnapshot(this.previousThemeSnapshot);
    }
    if (this.state().kind === "CUSTOM_EDITOR_OPEN") {
      this.state.set({ kind: "IDLE" });
    }
  }

  onCustomPreview(colors: CustomThemeColors): void {
    this.themeService.applyCustomColors(colors);
  }

  onCustomApply(colors: CustomThemeColors): void {
    this.themeService.applyCustomColors(colors);
    this.previousThemeSnapshot = null;
    this.roomService.updateRoom({ themeId: null, customTheme: colors });
    this.state.set({ kind: "IDLE" });
  }

  // ─── Material Editor ──────────────────────────
  onOpenMaterialEditor(): void {
    this.previousMaterialOverrides = this.themeService.materialOverrides()
      ? { ...this.themeService.materialOverrides()! }
      : null;
    this.state.set({ kind: "MATERIAL_EDITOR_OPEN" });
  }

  closeMaterialEditor(): void {
    if (this.state().kind === "MATERIAL_EDITOR_OPEN") {
      // Revert on dismiss (swipe-down)
      if (this.previousMaterialOverrides) {
        this.themeService.applyMaterialOverrides(
          this.previousMaterialOverrides
        );
      } else {
        this.themeService.clearMaterialOverrides();
      }
      this.state.set({ kind: "IDLE" });
    }
  }

  onMaterialPreview(overrides: MaterialOverrides): void {
    this.themeService.applyMaterialOverrides(overrides);
  }

  async onMaterialSave(overrides: MaterialOverrides): Promise<void> {
    this.themeService.applyMaterialOverrides(overrides);
    this.previousMaterialOverrides = null;

    // Use base theme colors (before material overrides) to preserve
    // built-in theme textures on non-overridden surfaces after reload.
    const baseTheme = this.themeService.baseTheme();
    const customColors = this.themeService.customColors();
    const colors = customColors ?? {
      leftWallColor: baseTheme.leftWall.color,
      backWallColor: baseTheme.backWall.color,
      floorColor: baseTheme.floor.color,
      background: baseTheme.background,
    };

    // Preserve themeId so built-in theme textures are restored on reload
    const currentRoom = this.roomService.room();
    const themeId = currentRoom?.themeId ?? null;

    await this.roomService.updateRoom({
      themeId,
      customTheme: { ...colors, materials: overrides },
    });
    this.state.set({ kind: "IDLE" });
  }

  onMaterialCancel(): void {
    if (this.previousMaterialOverrides) {
      this.themeService.applyMaterialOverrides(this.previousMaterialOverrides);
    } else {
      this.themeService.clearMaterialOverrides();
    }
    this.previousMaterialOverrides = null;
    this.state.set({ kind: "IDLE" });
  }

  // ─── Share ─────────────────────────────────────
  async onShare(): Promise<void> {
    this.state.set({ kind: "SHARE_OPEN" });
    const slug = await this.shareService.generateShareLink();
    if (slug) {
      this.shareLink.set(this.shareService.getShareUrl(slug));
    }
  }

  closeShare(): void {
    if (this.state().kind === "SHARE_OPEN") {
      this.state.set({ kind: "IDLE" });
    }
  }

  async onShareNative(): Promise<void> {
    const link = this.shareLink();
    if (!link) return;

    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title: this.translate.instant("room.shareTitle"),
        text: this.translate.instant("room.shareText"),
        url: link,
        dialogTitle: this.translate.instant("room.shareMessage"),
      });
    } catch {
      // User cancelled or share not supported — try web fallback
      try {
        await navigator.share({
          title: this.translate.instant("room.shareTitle"),
          url: link,
        });
      } catch {
        // Silently fail
      }
    }
  }

  async onShareScreenshot(): Promise<void> {
    try {
      const blob = await this.screenshotService.captureRoom();
      const file = new File([blob], "pain-cave.png", { type: "image/png" });

      // Try native Capacitor share first
      try {
        const { Share } = await import("@capacitor/share");

        // Convert blob to data URI for native sharing
        const reader = new FileReader();
        const dataUri = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // Write to a temp file and share
        const { Filesystem, Directory } = await import("@capacitor/filesystem");
        const base64Data = dataUri.split(",")[1];
        const tempFile = await Filesystem.writeFile({
          path: "pain-cave.png",
          data: base64Data,
          directory: Directory.Cache,
        });

        await Share.share({
          title: this.translate.instant("room.shareTitle"),
          files: [tempFile.uri],
        });
        return;
      } catch {
        // Fall through to web fallback
      }

      // Web fallback: navigator.share with file or download
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: this.translate.instant("room.shareTitle"),
          files: [file],
        });
      } else {
        // Download fallback
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "pain-cave.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // User cancelled or capture failed
    }
  }

  // ─── Thumbnail Capture ─────────────────────────────
  private captureThumbnail(): void {
    if (this.thumbnailCaptured) return;
    this.thumbnailCaptured = true;

    // Fire and forget — don't block navigation
    this.screenshotService
      .captureRoom()
      .then(async (blob) => {
        const result = await this.uploadService.uploadFile(
          blob,
          "room-thumbnail",
          "image/png"
        );
        if (result?.key) {
          await this.roomService.updateRoom({ thumbnailKey: result.key });
        }
      })
      .catch(() => {
        // Silently fail — thumbnail is non-critical
      });
  }

  // ─── Haptics ──────────────────────────────────────
  private async hapticLight(): Promise<void> {
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      /* not available */
    }
  }

  private async hapticMedium(): Promise<void> {
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      /* not available */
    }
  }

  private async hapticSuccess(): Promise<void> {
    try {
      const { Haptics, NotificationType } = await import("@capacitor/haptics");
      Haptics.notification({ type: NotificationType.Success });
    } catch {
      /* not available */
    }
  }
}
