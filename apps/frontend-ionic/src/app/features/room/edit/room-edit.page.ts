import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonModal,
  IonAlert,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { NgtCanvas } from 'angular-three/dom';
import { addIcons } from 'ionicons';
import {
  addOutline,
  trashOutline,
  refreshOutline,
  moveOutline,
  shareOutline,
} from 'ionicons/icons';

import { RoomService } from '@app/core/services/room.service';
import { TrophyService } from '@app/core/services/trophy.service';
import { ThemeService } from '@app/core/services/theme.service';
import { TokenService } from '@app/core/services/token.service';
import { ShareService } from '@app/core/services/share.service';
import { ScreenshotService } from '@app/core/services/screenshot.service';
import { DecorationService } from '@app/core/services/decoration.service';
import { type RoomTheme, type CustomThemeColors, CUSTOM_THEME_ID } from '@app/types/room-theme';

import { PainCaveSceneComponent, type ItemDragEvent } from '../components/pain-cave-scene/pain-cave-scene.component';
import { EditorToolbarComponent } from '../components/editor-toolbar/editor-toolbar.component';
import { ContextActionBarComponent } from '../components/context-action-bar/context-action-bar.component';
import { FloorPlacementPanelComponent, type FloorPlacementValues } from '../components/floor-placement-panel/floor-placement-panel.component';
import { ThemeSelectorSheetComponent } from '../components/theme-selector-sheet/theme-selector-sheet.component';
import { CustomThemeEditorComponent } from '../components/custom-theme-editor/custom-theme-editor.component';
import { ObjectCatalogSheetComponent } from '../components/object-catalog-sheet/object-catalog-sheet.component';
import { ShareRoomSheetComponent } from '../components/share-room-sheet/share-room-sheet.component';
import { WallPlacementPanelComponent, type WallPlacementValues } from '../components/wall-placement-panel/wall-placement-panel.component';

// ─── Editor State Machine ────────────────────────────────
type EditorState =
  | { kind: 'IDLE' }
  | { kind: 'SELECTED'; itemId: string }
  | { kind: 'DRAGGING'; itemId: string }
  | { kind: 'CATALOG_OPEN' }
  | { kind: 'SLOT_PICKING'; itemToPlace: string; source: 'catalog' | 'move' }
  | { kind: 'THEME_OPEN' }
  | { kind: 'CUSTOM_EDITOR_OPEN' }
  | { kind: 'SHARE_OPEN' }
  | { kind: 'CONFIRM_DELETE'; itemId: string };

@Component({
  selector: 'app-room-edit',
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
    IonContent,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonModal,
    IonAlert,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <!-- Toolbar -->
    <ion-header>
      <app-editor-toolbar
        [viewCount]="roomService.room()?.viewCount ?? 0"
        [likeCount]="roomService.room()?.likeCount ?? 0"
        (preview)="onPreview()"
        (openThemes)="openThemeSelector()"
        (share)="onShare()"
      />
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="editor-layout">
        <!-- Loading overlay (non-destructive — canvas stays alive) -->
        @if (roomService.loading()) {
          <div class="loading-overlay">
            <ion-spinner name="crescent" />
          </div>
        }

        <!-- 3D Canvas -->
        <div class="canvas-section">
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
              (itemPressed)="onItemPressed($event)"
              (itemDragged)="onItemDragged($event)"
              (itemDragEnd)="onItemDragEnd($event)"
            />
          </ngt-canvas>
        </div>

        <!-- Context Action Bar (shown when item selected) -->
        @if (isDecorationSelected()) {
          <app-floor-placement-panel
            [positionX]="selectedItem()?.positionX ?? 0"
            [positionY]="selectedItem()?.positionY ?? 0"
            [positionZ]="selectedItem()?.positionZ ?? 0"
            [rotationDegrees]="selectedItemRotationDeg()"
            [scale]="selectedItem()?.scaleX ?? 0.5"
            [name]="selectedItem()?.decoration?.name ?? null"
            (changed)="onFloorPlacementChange($event)"
            (delete)="confirmDelete()"
          />
        } @else if (isTrophySelected()) {
          <app-wall-placement-panel
            [wall]="selectedItem()?.wall ?? 'left'"
            [positionX]="selectedItem()?.positionX ?? 0"
            [positionY]="selectedItem()?.positionY ?? 1.5"
            [positionZ]="selectedItem()?.positionZ ?? 0"
            [name]="selectedItem()?.trophy?.raceResult?.race?.name ?? null"
            (changed)="onWallPlacementChange($event)"
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
      @if (state().kind === 'IDLE') {
        <ion-fab vertical="bottom" horizontal="end" slot="fixed">
          <ion-fab-button (click)="openCatalog()">
            <ion-icon name="add-outline" />
          </ion-fab-button>
        </ion-fab>
      }
    </ion-content>

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

    <!-- Delete Confirmation -->
    <ion-alert
      [isOpen]="state().kind === 'CONFIRM_DELETE'"
      header="Remove Item"
      message="Are you sure you want to remove this item from your room?"
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
  `,
})
export class RoomEditPage implements OnInit {
  roomService = inject(RoomService);
  themeService = inject(ThemeService);
  tokenService = inject(TokenService);
  private shareService = inject(ShareService);
  screenshotService = inject(ScreenshotService);
  private trophyService = inject(TrophyService);
  private decorationService = inject(DecorationService);
  private router = inject(Router);

  // ─── State Machine ───────────────────────────────
  state = signal<EditorState>({ kind: 'IDLE' });

  isItemSelected = computed(() => this.state().kind === 'SELECTED');
  selectedItemId = computed(() => {
    const s = this.state();
    if (s.kind === 'SELECTED') return s.itemId;
    if (s.kind === 'DRAGGING') return s.itemId;
    if (s.kind === 'CONFIRM_DELETE') return s.itemId;
    return null;
  });

  selectedItem = computed(() => {
    const id = this.selectedItemId();
    if (!id) return null;
    return this.roomService.room()?.items.find((i) => i.id === id) ?? null;
  });

  isDragging = computed(() => this.state().kind === 'DRAGGING');

  isDecorationSelected = computed(() => {
    const item = this.selectedItem();
    return !!item?.decorationId && !item.wall;
  });

  isTrophySelected = computed(() => {
    const item = this.selectedItem();
    return !!item?.trophyId && !!item.wall;
  });

  selectedItemRotationDeg = computed(() => {
    const item = this.selectedItem();
    return item ? Math.round((item.rotationY || 0) * 180 / Math.PI) : 0;
  });

  shareLink = signal<string | null>(null);
  private previousTheme: RoomTheme | null = null;

  deleteAlertButtons = [
    { text: 'Cancel', role: 'cancel' },
    { text: 'Delete', role: 'destructive', handler: () => this.doDelete() },
  ];

  constructor() {
    addIcons({ addOutline, trashOutline, refreshOutline, moveOutline, shareOutline });
  }

  async ngOnInit(): Promise<void> {
    const room = await this.roomService.fetchMyRoom();
    if (room) {
      const theme = this.themeService.resolveThemeFromRoom(room);
      if (theme.id === CUSTOM_THEME_ID && room.customTheme) {
        try {
          this.themeService.applyCustomColors(JSON.parse(room.customTheme));
        } catch {
          this.themeService.applyTheme(theme);
        }
      } else {
        this.themeService.applyTheme(theme);
      }
    }
    this.trophyService.fetchTrophies();
    this.tokenService.fetchBalance();
    this.decorationService.fetchInventory();
  }

  // ─── Item Interactions ───────────────────────────
  onItemPressed(itemId: string): void {
    // Floor tap → deselect
    if (itemId === '__deselect__') {
      this.state.set({ kind: 'IDLE' });
      return;
    }

    const s = this.state();
    if (s.kind === 'IDLE' || s.kind === 'SELECTED') {
      if (s.kind === 'SELECTED' && s.itemId === itemId) {
        this.state.set({ kind: 'IDLE' });
      } else {
        this.state.set({ kind: 'SELECTED', itemId });
        this.hapticLight();
      }
    } else if (s.kind === 'SLOT_PICKING') {
      // Clicking an item during slot picking — ignore
    }
  }

  // ─── Context Actions ─────────────────────────────
  confirmDelete(): void {
    const id = this.selectedItemId();
    if (id) {
      this.state.set({ kind: 'CONFIRM_DELETE', itemId: id });
    }
  }

  cancelDelete(): void {
    const s = this.state();
    if (s.kind === 'CONFIRM_DELETE') {
      this.state.set({ kind: 'SELECTED', itemId: s.itemId });
    }
  }

  async doDelete(): Promise<void> {
    const s = this.state();
    if (s.kind === 'CONFIRM_DELETE') {
      await this.roomService.removeItem(s.itemId);
      this.state.set({ kind: 'IDLE' });
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
    this.state.set({ kind: 'IDLE' });
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
    await this.roomService.updateItem(id, {
      positionX: values.positionX,
      positionY: values.positionY,
      positionZ: values.positionZ,
    });
  }

  // ─── Drag ─────────────────────────────────────────
  onItemDragged(event: ItemDragEvent): void {
    // Enter DRAGGING state to hide bottom bar
    const s = this.state();
    if (s.kind === 'SELECTED') {
      this.state.set({ kind: 'DRAGGING', itemId: s.itemId });
      this.hapticMedium();
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
      };
    });
    this.roomService.room.set({ ...room, items });
  }

  async onItemDragEnd(event: ItemDragEvent): Promise<void> {
    // Return to SELECTED state
    const s = this.state();
    if (s.kind === 'DRAGGING') {
      this.state.set({ kind: 'SELECTED', itemId: s.itemId });
    }

    // Persist final position to server
    const item = this.roomService.room()?.items.find((i) => i.id === event.itemId);
    if (!item) return;
    await this.roomService.updateItem(event.itemId, {
      positionX: event.positionX,
      positionY: event.positionY ?? item.positionY,
      positionZ: event.positionZ,
      rotationY: event.rotationY ?? item.rotationY,
    });
  }

  // ─── Catalog ─────────────────────────────────────
  openCatalog(): void {
    this.state.set({ kind: 'CATALOG_OPEN' });
  }

  closeCatalog(): void {
    if (this.state().kind === 'CATALOG_OPEN') {
      this.state.set({ kind: 'IDLE' });
    }
  }

  async onPlaceTrophy(trophyId: string): Promise<void> {
    await this.roomService.addItemToRoom(trophyId);
    this.state.set({ kind: 'IDLE' });
    this.hapticSuccess();
  }

  async onPlaceDecoration(decorationId: string): Promise<void> {
    // Acquire if not already owned (free decorations auto-acquire)
    if (!this.decorationService.isOwned(decorationId)) {
      const acquired = await this.decorationService.acquire(decorationId);
      if (!acquired) return;
    }
    await this.roomService.addDecorationToRoom(decorationId);
    this.state.set({ kind: 'IDLE' });
    this.hapticSuccess();
  }

  onGetTokens(): void {
    this.state.set({ kind: 'IDLE' });
    this.router.navigate(['/tokens']);
  }

  // ─── Theme Selector ──────────────────────────────
  openThemeSelector(): void {
    this.previousTheme = this.themeService.activeTheme();
    this.state.set({ kind: 'THEME_OPEN' });
  }

  closeThemeSelector(): void {
    // Don't reset to IDLE if we transitioned to the custom editor
    if (this.state().kind === 'CUSTOM_EDITOR_OPEN') return;
    if (this.state().kind === 'THEME_OPEN' && this.previousTheme) {
      this.themeService.applyTheme(this.previousTheme);
    }
    this.state.set({ kind: 'IDLE' });
  }

  onThemePreview(theme: RoomTheme): void {
    this.themeService.applyTheme(theme);
  }

  onThemeApply(theme: RoomTheme | null): void {
    if (theme) {
      this.themeService.applyTheme(theme);
      this.previousTheme = null;
      this.roomService.updateRoom({ themeId: theme.id, customTheme: null });
    }
    this.state.set({ kind: 'IDLE' });
  }

  // ─── Custom Theme Editor ──────────────────────────
  onOpenCustomEditor(): void {
    this.state.set({ kind: 'CUSTOM_EDITOR_OPEN' });
  }

  closeCustomEditor(): void {
    if (this.state().kind === 'CUSTOM_EDITOR_OPEN' && this.previousTheme) {
      this.themeService.applyTheme(this.previousTheme);
    }
    if (this.state().kind === 'CUSTOM_EDITOR_OPEN') {
      this.state.set({ kind: 'IDLE' });
    }
  }

  onCustomPreview(colors: CustomThemeColors): void {
    this.themeService.applyCustomColors(colors);
  }

  onCustomApply(colors: CustomThemeColors): void {
    this.themeService.applyCustomColors(colors);
    this.previousTheme = null;
    this.roomService.updateRoom({ themeId: null, customTheme: colors });
    this.state.set({ kind: 'IDLE' });
  }

  // ─── Share ─────────────────────────────────────
  async onShare(): Promise<void> {
    this.state.set({ kind: 'SHARE_OPEN' });
    const slug = await this.shareService.generateShareLink();
    if (slug) {
      this.shareLink.set(this.shareService.getShareUrl(slug));
    }
  }

  closeShare(): void {
    if (this.state().kind === 'SHARE_OPEN') {
      this.state.set({ kind: 'IDLE' });
    }
  }

  async onShareNative(): Promise<void> {
    const link = this.shareLink();
    if (!link) return;

    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: 'My Pain Cave',
        text: 'Check out my Pain Cave!',
        url: link,
        dialogTitle: 'Share your Pain Cave',
      });
    } catch {
      // User cancelled or share not supported — try web fallback
      try {
        await navigator.share({ title: 'My Pain Cave', url: link });
      } catch {
        // Silently fail
      }
    }
  }

  async onShareScreenshot(): Promise<void> {
    try {
      const blob = await this.screenshotService.captureRoom();
      const file = new File([blob], 'pain-cave.png', { type: 'image/png' });

      // Try native Capacitor share first
      try {
        const { Share } = await import('@capacitor/share');

        // Convert blob to data URI for native sharing
        const reader = new FileReader();
        const dataUri = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // Write to a temp file and share
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const base64Data = dataUri.split(',')[1];
        const tempFile = await Filesystem.writeFile({
          path: 'pain-cave.png',
          data: base64Data,
          directory: Directory.Cache,
        });

        await Share.share({
          title: 'My Pain Cave',
          files: [tempFile.uri],
        });
        return;
      } catch {
        // Fall through to web fallback
      }

      // Web fallback: navigator.share with file or download
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'My Pain Cave', files: [file] });
      } else {
        // Download fallback
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pain-cave.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // User cancelled or capture failed
    }
  }

  // ─── Toolbar Actions ─────────────────────────────
  onPreview(): void {
    const room = this.roomService.room();
    if (room) {
      this.router.navigate(['/room', room.userId]);
    }
  }

  // ─── Haptics ──────────────────────────────────────
  private async hapticLight(): Promise<void> {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      Haptics.impact({ style: ImpactStyle.Light });
    } catch { /* not available */ }
  }

  private async hapticMedium(): Promise<void> {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      Haptics.impact({ style: ImpactStyle.Medium });
    } catch { /* not available */ }
  }

  private async hapticSuccess(): Promise<void> {
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      Haptics.notification({ type: NotificationType.Success });
    } catch { /* not available */ }
  }

}
