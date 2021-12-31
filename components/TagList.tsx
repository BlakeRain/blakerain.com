import { FC } from "react";
import Link from "next/link";
import { Tag } from "../lib/content";
import cn from "classnames";
import styles from "./TagList.module.scss";

export const TagList: FC<{
  tags: Tag[];
  large?: boolean;
}> = ({ tags, large }) => {
  return (
    <ul
      className={cn({
        [styles.tagList]: true,
        [styles.tagListLarge]: large,
      })}
    >
      {tags
        .filter((tag) => tag.visibility === "public")
        .map((tag, index) => (
          <li key={index.toString()}>
            <Link href={"/tags/" + tag.slug}>
              <a title={tag.description || ""}>{tag.name}</a>
            </Link>
          </li>
        ))}
    </ul>
  );
};
