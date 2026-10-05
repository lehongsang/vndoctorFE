/**
 * Utilities for computing word-level and line-level diffs
 * similar to Git diff / File changes in IDEs.
 */

export type DiffType = "added" | "removed" | "unchanged";

export interface DiffPart {
   type: DiffType;
   value: string;
}

/**
 * Tokenize string into words, whitespaces, and punctuation
 */
function tokenizeWords(str: string): string[] {
   if (!str) return [];
   // Split while capturing delimiters
   return str.split(/([^\S\r\n]+|[\r\n]+|[.,!?;:(){}\[\]"'`\-+=/\\*&^%$#@~<>|])/g).filter(Boolean);
}

/**
 * Compute Longest Common Subsequence (LCS) diff on word/token level.
 */
export function computeWordDiff(oldText: string = "", newText: string = ""): DiffPart[] {
   const a = tokenizeWords(oldText);
   const b = tokenizeWords(newText);

   const m = a.length;
   const n = b.length;

   // Edge cases
   if (m === 0 && n === 0) return [];
   if (m === 0) return [{ type: "added", value: newText }];
   if (n === 0) return [{ type: "removed", value: oldText }];
   if (oldText === newText) return [{ type: "unchanged", value: oldText }];

   // Build DP table
   // To keep memory reasonable for large strings, limit table size if huge
   if (m * n > 250000) {
      // Fallback for massive text
      return [
         { type: "removed", value: oldText },
         { type: "added", value: newText },
      ];
   }

   const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

   for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
         if (a[i - 1] === b[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
         } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
         }
      }
   }

   // Backtrack to find diff
   const rawDiff: DiffPart[] = [];
   let i = m;
   let j = n;

   while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
         rawDiff.push({ type: "unchanged", value: a[i - 1] });
         i--;
         j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
         rawDiff.push({ type: "added", value: b[j - 1] });
         j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
         rawDiff.push({ type: "removed", value: a[i - 1] });
         i--;
      }
   }

   rawDiff.reverse();

   // Merge adjacent parts with same type
   const merged: DiffPart[] = [];
   for (const part of rawDiff) {
      if (merged.length > 0 && merged[merged.length - 1].type === part.type) {
         merged[merged.length - 1].value += part.value;
      } else {
         merged.push({ ...part });
      }
   }

   return merged;
}

export interface FieldDiffItem {
   key: string;
   label: string;
   category: "vitals" | "diagnosis" | "general" | "treatment" | "conclusion";
   oldValue: string;
   newValue: string;
   hasChanged: boolean;
   isWordDiff: boolean;
   diffParts: DiffPart[];
}

export interface ExaminationDiffSummary {
   totalChanges: number;
   addedCount: number;
   removedCount: number;
   items: FieldDiffItem[];
}
