import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const blogDir = path.join(process.cwd(), "blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  date: string;
  author: string;
  funnel_stage: string;
  pillar: string;
}

export interface BlogPostWithContent extends BlogPost {
  contentHtml: string;
}

export function getAllPosts(): BlogPost[] {
  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".md"));

  const posts = files.map((filename) => {
    const raw = fs.readFileSync(path.join(blogDir, filename), "utf-8");
    const { data } = matter(raw);

    return {
      slug: data.slug || filename.replace(/\.md$/, ""),
      title: data.title || "",
      description: data.description || "",
      keywords: data.keywords || [],
      date: data.date ? String(data.date) : "",
      author: data.author || "",
      funnel_stage: data.funnel_stage || "",
      pillar: data.pillar || "",
    };
  });

  return posts.sort((a, b) => (a.title > b.title ? 1 : -1));
}

export async function getPostBySlug(
  slug: string
): Promise<BlogPostWithContent | null> {
  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".md"));

  for (const filename of files) {
    const raw = fs.readFileSync(path.join(blogDir, filename), "utf-8");
    const { data, content } = matter(raw);
    const fileSlug = data.slug || filename.replace(/\.md$/, "");

    if (fileSlug === slug) {
      const result = await remark().use(html).process(content);

      return {
        slug: fileSlug,
        title: data.title || "",
        description: data.description || "",
        keywords: data.keywords || [],
        date: data.date ? String(data.date) : "",
        author: data.author || "",
        funnel_stage: data.funnel_stage || "",
        pillar: data.pillar || "",
        contentHtml: result.toString(),
      };
    }
  }

  return null;
}
