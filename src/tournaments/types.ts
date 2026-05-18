export type BallType = 8 | 9 | 10;

export type TournamentLevel = "pro" | "amateur" | "both";

export type Tournament = {
  id: number;
  name: string;
  version: string;
  type: BallType;
  level: TournamentLevel;
  handicap: boolean;
  city: string;
  club: string;
  date: string;
  startHour: string;
  dressCode: boolean;
};

export type TournamentInput = Omit<Tournament, "id">;

export type Filters = {
  types: BallType[];
  levels: TournamentLevel[];
  handicap: "any" | "yes" | "no";
  dressCode: "any" | "yes" | "no";
  cities: string[];
  clubs: string[];
  dayKind: "any" | "workday" | "weekend";
  q: string;
};

export type TournamentStatus = "past" | "today" | "upcoming";

export type TournamentRow = {
  id: number;
  name: string;
  version: string;
  type: BallType;
  level: TournamentLevel;
  handicap: boolean;
  city: string;
  club: string;
  date: string;
  start_hour: string;
  dress_code: boolean;
};

export interface TournamentsService {
  list(): Promise<Tournament[]>;
  byMonth(year: number, month: number): Promise<Tournament[]>;
  get(id: number): Promise<Tournament>;
  create(input: TournamentInput): Promise<Tournament>;
  update(id: number, patch: Partial<TournamentInput>): Promise<Tournament>;
  delete(id: number): Promise<void>;
}
