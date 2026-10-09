import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { tools, getCategoryById } from "@/lib/tools-data";
import { ToolClientView } from "./ToolClientView";

interface Props {
  params: Promise<{ categoryId: string; toolId: string }>;
}

const explicitRoutes = new Set([
  "pdf/merge",
  "pdf/split",
  "qr/generator",
  "image/compress",
  "image/convert",
  "student/gpa",
  "student/attendance",
  "developer/json",
  "utilities/unit-converter",
]);

export async function generateStaticParams() {
  return tools
    .filter((tool) => {
      const key = `${tool.categoryId}/${tool.href.split("/").pop()}`;
      return !explicitRoutes.has(key);
    })
    .map((tool) => {
      const parts = tool.href.split("/");
      return {
        categoryId: tool.categoryId,
        toolId: parts[parts.length - 1],
      };
    });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId, toolId } = await params;
  const tool = tools.find(
    (t) => t.categoryId === categoryId && t.href.endsWith(`/${toolId}`)
  );
  if (!tool) return {};
  return {
    title: `${tool.name} — Free Online Tool`,
    description: tool.description,
  };
}

export default async function GenericToolPage({ params }: Props) {
  const { categoryId, toolId } = await params;
  const tool = tools.find(
    (t) => t.categoryId === categoryId && t.href.endsWith(`/${toolId}`)
  );
  const category = getCategoryById(categoryId);

  if (!tool || !category) {
    notFound();
  }

  const relatedTools = tools
    .filter((t) => t.categoryId === categoryId && t.id !== tool.id)
    .slice(0, 5);

  return (
    <ToolClientView
      tool={tool}
      category={category}
      relatedTools={relatedTools}
    />
  );
}
