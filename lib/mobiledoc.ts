export interface MobileDoc {
  version: string;
  markups: Markup[];
  atoms: Atom[];
  cards: Card[];
  sections: Section[];
}

export const emptyMobileDoc: MobileDoc = {
  version: "0.3.1",
  markups: [],
  atoms: [],
  cards: [],
  sections: [],
};

export type MarkupTagName =
  | "a"
  | "b"
  | "code"
  | "em"
  | "i"
  | "s"
  | "strong"
  | "sub"
  | "sup"
  | "u";
export type Markup = [MarkupTagName] | [MarkupTagName, string[]];

export type Atom<Payload = {}> = [
  string, // name
  string, // text value
  Payload
];

export type Card<Payload = {}> = [
  string, // name
  Payload
];

export type MarkupSectionTagName =
  | "aside"
  | "blockquote"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p";

export type MarkupSection = [1, MarkupSectionTagName, Marker[]];

export type ImageSection = [2, string];

export type ListSectionTagName = "ul" | "ol";

export type ListSection = [3, ListSectionTagName, Marker[][]];

export type CardSection = [10, number];

export type Section = MarkupSection | ImageSection | ListSection | CardSection;

export type TextMarker = [0, number[], number, string];
export type AtomMarker = [1, number[], number, number];
export type Marker = TextMarker | AtomMarker;
