export type KeybrewDevice = "mobile" | "desktop" | "both";
export type KeybrewActivation = "focus" | "manual";
export type KeybrewNativeKeyboard = boolean | "while-open";
export type KeybrewPosition = "floating" | "inline";
export type KeybrewPlacement = "auto" | "below" | "above";
export type KeybrewAlignment = "left" | "center" | "right";
export type KeybrewLayout = "hebrew" | "niqqud" | "numbers" | "symbols";

export interface KeybrewLabels {
  keyboard?: string;
  title?: string;
  close?: string;
  backspace?: string;
  space?: string;
  hebrew?: string;
  niqqud?: string;
  numbers?: string;
  symbols?: string;
  opened?: string;
  closed?: string;
}

export interface KeybrewBaseDetail {
  instance: Keybrew;
  [key: string]: unknown;
}

export interface KeybrewEventDetail extends KeybrewBaseDetail {
  input: HTMLInputElement | HTMLTextAreaElement;
}

export interface KeybrewOptions {
  enabledOn?: KeybrewDevice;
  suppressNativeKeyboard?: KeybrewNativeKeyboard;
  openOn?: KeybrewActivation;
  position?: KeybrewPosition;
  placement?: KeybrewPlacement;
  align?: KeybrewAlignment;
  gap?: number;
  viewportPadding?: number;
  minWidth?: number;
  maxWidth?: number;
  scrollIntoView?: boolean;
  scrollBehavior?: "auto" | "smooth";
  setDirection?: boolean;
  includeNiqqud?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  observe?: boolean;
  inlineContainer?: string | Element | ((input: HTMLInputElement | HTMLTextAreaElement) => Element | null);
  deviceMatcher?: (window: Window) => boolean;
  labels?: KeybrewLabels;
  keyLabels?: Record<string, string>;
  onOpen?: (input: HTMLInputElement | HTMLTextAreaElement, detail: KeybrewEventDetail) => void;
  onClose?: (input: HTMLInputElement | HTMLTextAreaElement | null, detail: KeybrewBaseDetail & { input: HTMLInputElement | HTMLTextAreaElement | null; reason: string }) => void;
  onInput?: (value: string, detail: KeybrewEventDetail & { value: string; data: string | null; inputType: string | null; originalEvent: Event }) => void;
  onKeyPress?: (key: string, detail: KeybrewEventDetail & { key: string; originalEvent: Event }) => void;
  onLayoutChange?: (layout: KeybrewLayout, detail: KeybrewEventDetail & { layout: KeybrewLayout }) => void;
}

export default class Keybrew {
  static readonly version: string;
  static readonly keys: Readonly<Record<string, string>>;
  static readonly layouts: Readonly<Record<KeybrewLayout, readonly (readonly string[])[]>>;
  static auto(options?: KeybrewOptions): Keybrew;
  static isTouchFirst(window: Window): boolean;

  readonly id: string;
  readonly root: HTMLDivElement;
  readonly inputs: Set<HTMLInputElement | HTMLTextAreaElement>;
  options: KeybrewOptions;

  constructor(
    targets: string | HTMLInputElement | HTMLTextAreaElement | Iterable<HTMLInputElement | HTMLTextAreaElement> | ArrayLike<HTMLInputElement | HTMLTextAreaElement>,
    options?: KeybrewOptions
  );

  attach(targets: string | HTMLInputElement | HTMLTextAreaElement | Iterable<HTMLInputElement | HTMLTextAreaElement> | ArrayLike<HTMLInputElement | HTMLTextAreaElement>): this;
  detach(targets?: string | HTMLInputElement | HTMLTextAreaElement | Iterable<HTMLInputElement | HTMLTextAreaElement> | ArrayLike<HTMLInputElement | HTMLTextAreaElement>): this;
  open(input?: string | HTMLInputElement | HTMLTextAreaElement): boolean;
  close(reason?: string, restoreFocus?: boolean): boolean;
  toggle(input?: HTMLInputElement | HTMLTextAreaElement): boolean;
  isOpen(): boolean;
  getActiveInput(): HTMLInputElement | HTMLTextAreaElement | null;
  setOptions(options: Partial<KeybrewOptions>): this;
  destroy(): void;
}

export { Keybrew };
