import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import { BLOG_POSTS } from "@/data/blogPosts";

export default function BlogIndexPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        title="Product Updates"
        subtitle="Release notes and transparency notes for Raw Block explorer, labs, and learning content."
        icon="📰"
        gradient="from-amber-300 via-orange-400 to-rose-500"
      />

      <ul className="space-y-4">
        {BLOG_POSTS.map((post) => (
          <li key={post.slug}>
            <Card className="p-5">
              <Link href={`/blog/${post.slug}`} className="block space-y-2">
                <time
                  dateTime={post.datePublished}
                  className="text-xs uppercase tracking-wide text-slate-500"
                >
                  {post.datePublished}
                </time>
                <h2 className="text-lg font-semibold text-slate-100 hover:text-cyan-300">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-400">{post.description}</p>
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
