import { summarizeQg, type QgSummary } from "@/lib/rules/qg-summary";
import { getNow } from "./clock";
import { getOpenPraiseWindow, listCheckins, listMeals, listRadioCheckouts, listRadios } from "./repo";

export async function loadQgSummary(includeMeals: boolean): Promise<QgSummary> {
  const [meals, checkins, radios, checkouts, openWindow, now] = await Promise.all([
    includeMeals ? listMeals() : Promise.resolve([]),
    includeMeals ? listCheckins() : Promise.resolve([]),
    listRadios(),
    listRadioCheckouts(),
    getOpenPraiseWindow(),
    getNow(),
  ]);
  return summarizeQg({ meals, checkins, radios, checkouts, openWindow, now });
}
