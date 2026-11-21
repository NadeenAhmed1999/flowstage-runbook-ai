/** Invented 28-sheet "master plan" workbook mirroring a real customer layout. All names are fictional. */
import * as XLSX from "xlsx";

const NB = "\u00a0";
const HEADER = ["DAY", "SPACE", "LEAD", "#", "SESSION TITLE", "DATE (day)", "OPEN", "MINs (duration)", "CLOSE", "FORMAT (Panel/Open Mic/FS)",
  "SESSION DESCRIPTION", "BLOCK & THEME NAME", "SPEAKER 1", "SPEAKER 2", "SPEAKER 3", "MODERATOR", "MC"];

const r = (day: number, title: string, date: string, open: string, mins: string, close: string, format = "", speakers: string[] = [], moderator = "") =>
  [String(day), "Main Hall", "Team Blue", "", title, date, open, mins, close, format, NB, "Block One",
    speakers[0] ?? NB, speakers[1] ?? NB, speakers[2] ?? NB, moderator || NB, NB];

export const AGENDA_ROWS = [
  r(1, "Registration & Networking", "November 29th", "09:00:00", "60", "10:00:00"),
  r(1, "National Anthem & Opening Ceremony", "November 29th", "10:30:00", "", "11:30:00"),
  r(1, "Opening Performance & Video", "November 29th", "10:50:00", "15", "11:05:00"),
  r(1, "Welcome Address by Dana Example, CEO", "November 29th", "11:15:00", "15", "11:30:00", "", ["Dana Example, CEO, Northwind Health"]),
  r(1, "Future of Care Panel", "November 29th", "11:45:00", "45", "12:30:00", "Panel",
    ["Lee Sample, Director, Contoso Clinics", "Ari Placeholder, Head of Policy, Fabrikam", "Dana Example, CEO, Northwind Health"], "Moderator: Sam Fictional, Editor"),
  r(1, "Networking Break", "November 29th", "12:30:00", "30", "13:00:00"),
  r(1, "Fireside with a Founder", "November 29th", "13:00:00", NB, "13:40:00", "Fireside Chat", ["Kim Invented, Founder, Tailspin Labs"]),
  r(2, "Audience Survey", "November 30th", "10:00:00", "20", "10:20:00", "Survey"),
  r(2, "Partnership MOU", "November 30th", "10:20:00", "20", "10:40:00", "MOU Signing", ["Lee Sample, Director, Contoso Clinics"]),
  r(2, "Awards Ceremony", "November 30th", "18:00:00", "90", "19:30:00"),
];

export function buildMasterPlanWorkbook() {
  const wb = XLSX.utils.book_new();
  const wide = (row: string[]) => [...row, ...Array.from({ length: 285 - row.length }, () => NB)];
  const agenda = [wide(["Fictional Health Forum 2026"]), wide(["Master Plan"]), wide([]), wide(HEADER), ...AGENDA_ROWS.map(wide)];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(agenda), "AGENDA");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Time", "Item"], ["11:00", "Doors"], ["11:10", "Anthem"], ["11:30", "End"]]), "Opening ceremony");
  const names = ["Speakers list", "Awardees", "Venue", "Booths", "Podcast", "Gifts"];
  for (let i = 0; wb.SheetNames.length < 28; i++) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(i < names.length ? [["Name", "Notes"], ["Invented Person", NB]] : [[NB]]), names[i] ?? `Sheet ${i + 1}`);
  }
  return wb;
}

export function masterPlanFile(fileName = "Fictional Forum 2026 Master Plan.xlsx") {
  const bytes = XLSX.write(buildMasterPlanWorkbook(), { type: "array", bookType: "xlsx" });
  return new File([bytes], fileName);
}
