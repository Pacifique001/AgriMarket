"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, Calendar, Share2 } from "lucide-react"
import { blogPosts } from "@/lib/blog-data"

export default function BlogPostPage() {
  const params = useParams()
  const post = blogPosts.find((p) => p.slug === params.slug)

  if (!post) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-20 text-center space-y-6">
        <h1 className="text-4xl font-bold">Post Not Found</h1>
        <p className="text-muted-foreground">
          The article you are looking for does not exist or has been moved.
        </p>
        <Button asChild>
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-20 space-y-10">

      {/* Back link */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Articles
          </Link>
        </Button>
      </motion.div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-5"
      >
        <Badge variant="secondary">{post.category}</Badge>

        <h1 className="text-3xl md:text-5xl font-bold leading-tight">
          {post.title}
        </h1>

        <p className="text-lg text-muted-foreground">
          {post.description}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {post.readTime}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </motion.header>

      {/* Divider */}
      <hr className="border-border/40" />

      {/* Content */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="prose prose-neutral dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-muted-foreground prose-p:leading-relaxed
          prose-li:text-muted-foreground
          prose-strong:text-foreground
          prose-code:text-sm prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-secondary prose-pre:border prose-pre:border-border/40 prose-pre:rounded-xl
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-table:border-collapse prose-th:border prose-th:border-border/40 prose-th:px-4 prose-th:py-2 prose-th:bg-secondary
          prose-td:border prose-td:border-border/40 prose-td:px-4 prose-td:py-2
        "
        dangerouslySetInnerHTML={{
          __html: renderMarkdown(post.content),
        }}
      />

      {/* Footer */}
      <div className="pt-8 border-t border-border/40 flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: post.title, url: window.location.href })
            } else {
              navigator.clipboard.writeText(window.location.href)
            }
          }}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
    </main>
  )
}

/* ===============================================================
   Lightweight markdown → HTML converter (no external dependency).
   Handles headings, bold, italic, code blocks, inline code,
   lists, links, tables, and horizontal rules.
   =============================================================== */
function renderMarkdown(md: string): string {
  let html = md

  // Fenced code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
    return `<pre><code class="language-${lang}">${escaped}</code></pre>`
  })

  // Tables
  html = html.replace(
    /(?:^|\n)(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/g,
    (_m, headerRow, _sep, bodyRows) => {
      const headers = headerRow
        .split("|")
        .filter((c: string) => c.trim())
        .map((c: string) => `<th>${c.trim()}</th>`)
        .join("")
      const rows = bodyRows
        .trim()
        .split("\n")
        .map((row: string) => {
          const cells = row
            .split("|")
            .filter((c: string) => c.trim())
            .map((c: string) => `<td>${c.trim()}</td>`)
            .join("")
          return `<tr>${cells}</tr>`
        })
        .join("")
      return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`
    }
  )

  // Headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>")
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>")
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>")

  // Horizontal rule
  html = html.replace(/^---$/gm, "<hr />")

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>")

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>")

  // Unordered lists
  html = html.replace(
    /((?:^- .+\n?)+)/gm,
    (block) => {
      const items = block
        .trim()
        .split("\n")
        .map((line) => `<li>${line.replace(/^- /, "")}</li>`)
        .join("")
      return `<ul>${items}</ul>`
    }
  )

  // Ordered lists
  html = html.replace(
    /((?:^\d+\. .+\n?)+)/gm,
    (block) => {
      const items = block
        .trim()
        .split("\n")
        .map((line) => `<li>${line.replace(/^\d+\. /, "")}</li>`)
        .join("")
      return `<ol>${items}</ol>`
    }
  )

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Paragraphs — wrap orphan lines
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim()
      if (
        !trimmed ||
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("<table") ||
        trimmed.startsWith("<hr")
      ) {
        return trimmed
      }
      return `<p>${trimmed}</p>`
    })
    .join("\n")

  return html
}
