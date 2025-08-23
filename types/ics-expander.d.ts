
declare module "ical-expander" {
    export interface IcalExpanderOptions {
      ics: string;
      maxIterations?: number;
      skipInvalidDates?: boolean;
    }
    export type DateLike = Date | { toJSDate(): Date };
    export interface IcalEvent {
      startDate: DateLike;
      endDate: DateLike;
      summary?: string;
      location?: string;
    }
  
    export interface IcalOccurrence {
      startDate: DateLike;
      endDate: DateLike;
      item: IcalEvent;
    }
  
    export default class IcalExpander {
      constructor(options: IcalExpanderOptions);
      between(start: Date, end: Date): {
        events: IcalEvent[];
        occurrences: IcalOccurrence[];
      };
    }
  }
  