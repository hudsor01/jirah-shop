import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateLong } from "@/lib/format";

type BlogCardProps = {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  tags: string[];
  publishedAt: string | null;
};

export function BlogCard({
  title,
  slug,
  excerpt,
  coverImage,
  tags,
  publishedAt,
}: BlogCardProps) {
  return (
    <Card className="group h-full overflow-hidden rounded-2xl py-0 shadow-none transition-shadow hover:shadow-md">
      {/* Cover Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br/oklch from-primary/20 to-accent/20">
            <span className="font-serif text-lg text-muted-foreground/50">
              Jirah Shop
            </span>
          </div>
        )}
      </div>

      <CardHeader className="gap-2 px-5 pt-5 pb-0">
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <CardTitle className="font-serif text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
          <Link href={`/blog/${slug}`}>{title}</Link>
        </CardTitle>

        {/* Excerpt */}
        <CardDescription className="line-clamp-3 font-sans text-sm leading-relaxed">
          {excerpt}
        </CardDescription>
      </CardHeader>

      <CardFooter className="flex items-center justify-between px-5 pt-3 pb-5">
        {publishedAt && (
          <span className="text-xs text-muted-foreground">
            {formatDateLong(publishedAt)}
          </span>
        )}

        <Button
          asChild
          variant="link"
          className="ml-auto h-auto gap-1 p-0 text-sm font-medium text-primary"
        >
          <Link href={`/blog/${slug}`}>
            Read More
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
