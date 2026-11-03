import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import { BLOG_POSTS, getBlogPost } from "@/data/blogPosts";
import { breadcrumbJsonLd, buildPageMetadata, techArticleJsonLd } from "@/lib/seo";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return buildPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    image: "/og/blog.svg",
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Updates", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      <JsonLd
        data={techArticleJsonLd({
          headline: post.title,
          description: post.description,
          path: `/blog/${post.slug}`,
          datePublished: post.datePublished,
          dateModified: post.dateModified,
          about: post.about,
        })}
      />

      <PageHeader title={post.title} subtitle={post.description} icon="📰" />

      <Card className="space-y-4 p-6">
        {post.body.map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="text-sm leading-relaxed text-slate-300">
            {paragraph}
          </p>
        ))}
      </Card>

      <Link href="/blog" className="text-sm text-cyan-400 hover:underline">
        ← All updates
      </Link>
    </article>
  );
}
