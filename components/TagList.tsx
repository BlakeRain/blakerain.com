import { FC } from "react";
import Link from "next/link";
import { TagDictionary, TagId } from "../lib/ghost";
import cn from "classnames";
import styles from "./TagList.module.scss";

export const TagList: FC<{ tagsDict: TagDictionary; tags: TagId[]; large?: boolean }> = ({
  tagsDict,
  tags,
  large,
}) => {
  return (
    <ul
      className={cn({
        [styles.tagList]: true,
        [styles.tagListLarge]: large,
      })}>
      {tags
        .map((tag_id) => tagsDict[tag_id])
        .filter((tag) => tag.visibility === "public")
        .map((tag) => (
          <li key={tag.id}>
            <Link href={"/tags/" + tag.slug}>
              <a title={tag.description || ""}>{tag.name}</a>
            </Link>
          </li>
        ))}
    </ul>
  );
};
