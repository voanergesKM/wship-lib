export type Block =
  | {
      type: "heading";
      level: 1 | 2 | 3;
      text: string;
      align: "left" | "center" | "right";
    }
  | {
      type: "lyrics";
      parts: Part[];
      align: "left" | "center" | "right";
    }
  | {
      type: "empty";
      align: "left";
    };

export type Part = {
  chord?: string;
  lyric: string;
};
