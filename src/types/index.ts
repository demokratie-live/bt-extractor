export interface Link {
  text: string;
  url: string;
}

export interface ObjWithLinks {
  links: Link[];
}

export interface DrucksacheBase {
  type: string;
  title: string;
  url: string;
  date: string;
  period: number;
}
