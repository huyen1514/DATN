"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import StudentLayout from "@/components/StudentLayout";
import { BookA, CopyPlus, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Level {
  levelId: number;
  levelName: string;
}

interface Lesson {
  lessonId: number;
  lessonName?: string;
  skillType?: string;
}

interface VocabularyItem {
  lessonId: number;
}

export default function VocabularyLessonsPage() {
  const params = useParams();
  const levelName = params.levelName as string;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [vocabCounts, setVocabCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const isVocabularySkill = (skillType?: string) => {
    if (!skillType) return true;

    const raw = skillType.trim().toLowerCase();
    const normalized = raw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return (
      normalized === "tu vung" ||
      normalized === "tu do" ||
      normalized === "tu-vung" ||
      normalized === "tu-do" ||
      normalized === "vocabulary" ||
      normalized === "free" ||
      raw === "tá»« vá»±ng" ||
      raw === "tá»± do"
    );
  };

  const loadData = useCallback(async () => {
    try {
      const levelsData = await api("/levels");
      const levels: Level[] = Array.isArray(levelsData) ? (levelsData as Level[]) : [];
      const targetLevel = levels.find((l) => l.levelName.toUpperCase() === levelName.toUpperCase());

      if (!targetLevel) {
        setLessons([]);
        setVocabCounts({});
        return;
      }

      const [levelLessonsData, allVocabsData] = await Promise.all([
        api(`/lessons/level/${targetLevel.levelId}`),
        api("/vocabularies"),
      ]);

      if (!Array.isArray(levelLessonsData) || !Array.isArray(allVocabsData)) {
        setLessons([]);
        setVocabCounts({});
        return;
      }

      const levelLessons = levelLessonsData as Lesson[];
      const allVocabs = allVocabsData as VocabularyItem[];

      const counts: Record<number, number> = {};
      allVocabs.forEach((v) => {
        counts[v.lessonId] = (counts[v.lessonId] || 0) + 1;
      });
      setVocabCounts(counts);

      const validLessons = levelLessons.filter(
        (l) => isVocabularySkill(l.skillType) && (counts[l.lessonId] || 0) > 0
      );
      setLessons(validLessons);
    } catch (e) {
      console.error(e);
      setLessons([]);
      setVocabCounts({});
    } finally {
      setIsLoading(false);
    }
  }, [levelName]);

  useEffect(() => {
    setIsLoading(true);
    void loadData();
  }, [loadData]);

  return (
    <StudentLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="mb-2 flex items-center gap-2 text-2xl font-semibold text-jp-indigo">
            <BookA size={22} className="text-emerald-600" />
            Vocabulary - {levelName}
          </h1>
          <p className="text-sm text-neutral-600">
            Choose a lesson to start reviewing vocabulary for level {levelName.toUpperCase()}.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-neutral-200 bg-white" />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center">
            <CopyPlus size={40} className="mx-auto mb-4 text-neutral-300" />
            <h3 className="mb-2 text-lg font-semibold text-jp-indigo">No lessons yet</h3>
            <p className="text-sm text-neutral-600">
              Vocabulary content for level {levelName} is being updated.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {lessons.map((lesson) => (
              <Link
                key={lesson.lessonId}
                href={`/vocabulary/${levelName}/${lesson.lessonId}`}
                className="group block rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:bg-neutral-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="mb-3 inline-flex rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                      Lesson
                    </span>
                    <h3 className="truncate text-base font-semibold text-jp-indigo">
                      {lesson.lessonName || `Lesson ${lesson.lessonId}`}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-500">{vocabCounts[lesson.lessonId] || 0} words</p>
                  </div>
                  <div className="mt-1 text-neutral-400 transition-colors group-hover:text-neutral-700">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
