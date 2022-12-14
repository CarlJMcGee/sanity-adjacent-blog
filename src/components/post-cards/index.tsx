import * as React from "react";
import type { Session } from "next-auth";
import type { PostFull } from "../../types/trpc-models";
import { trpc } from "../../utils/trpc";
import {
  Card,
  Image,
  Text,
  Title,
  Group,
  Input,
  ActionIcon,
  Spoiler,
  Paper,
  Avatar,
  UnstyledButton,
  Stack,
} from "@mantine/core";
import { IconSquareArrowRight } from "@tabler/icons";
import moment from "moment";
import Link from "next/link";
import LikeButton from "./likeButton";
import { useChannel } from "../../utils/pusherStore";

export interface IPostCardProps {
  post: PostFull | undefined;
  sess: Session | null;
}

const PostCard = ({ post, sess }: IPostCardProps) => {
  const utils = trpc.useContext();

  // state
  const [comment, setComment] = React.useState("");

  // queries
  const { data: comments } = trpc.useQuery([
    "post.getComments",
    { postId: post!.id },
  ]);

  // mutations
  const { mutate: addComment } = trpc.useMutation(["comment.add"]);

  // pusher
  const { BindNRefetch } = useChannel("main");
  BindNRefetch(["added_comment"], async () => {
    await utils.invalidateQueries("post.getComments");
  });

  if (!post) {
    return <h2>Post not found</h2>;
  }

  // handler
  const commentHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    addComment({ content: comment, postId: post.id });
    setComment("");
  };

  // wibbly wobbly timey wimey
  const timeAgo = (date: Date | undefined) => moment(date).fromNow();

  return (
    <Card shadow={"xl"} p="lg" className="w-96 m-5">
      {/* title and user */}
      <Card.Section>
        <Title order={2} className="px-3 pt-3">
          {post.title}
        </Title>
        <Stack justify={"space-around"}>
          <div>
            <Group position="left" spacing={"xs"}>
              <Text size={"lg"} weight="" className="pl-5">
                {`Says `}
              </Text>
              <Link href={"/"} passHref>
                <UnstyledButton>
                  <Group position="left" spacing={"xs"}>
                    <Text span size={30}>
                      {post.user.name}
                    </Text>
                    <Avatar src={post.user.image} radius={"lg"} size={"md"} />
                  </Group>
                </UnstyledButton>
              </Link>
            </Group>
            <Text size={"sm"} className="px-5">
              {timeAgo(post.createdAt)}
            </Text>
          </div>
          <Group mx={15} position={"left"}>
            <LikeButton post={post} sess={sess} />
          </Group>
        </Stack>
      </Card.Section>

      {/* post content and image */}
      <Group position="center" mt={"lg"} mb={"xs"}>
        <Text size={"md"} weight="lighter">
          {post.content}
        </Text>
      </Group>
      {post.image && (
        <Card.Section>
          <a href={post.image} target="_blank" rel="noreferrer">
            <Image
              src={post.image}
              alt={`post ${post.title} image`}
              withPlaceholder
            />
          </a>
        </Card.Section>
      )}

      {/* comment section */}
      <Card.Section withBorder>
        {/* add comment form */}
        {sess?.user ? (
          <form onSubmit={commentHandler}>
            <Group position="left" m={"md"}>
              <Input
                placeholder="Comment..."
                className=""
                value={comment}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setComment(e.target.value)
                }
              />
              <ActionIcon
                type="submit"
                variant="light"
                color={"grape"}
                size="lg"
              >
                <IconSquareArrowRight size={30} />
              </ActionIcon>
            </Group>
          </form>
        ) : (
          <Text size={"sm"} m="xs" color={"cyan"}>
            Log in to leave your thoughts
          </Text>
        )}
        <Spoiler
          maxHeight={200}
          showLabel="See more Comments"
          hideLabel="Hide"
          m={"sm"}
        >
          {/* comments */}
          {!comments ? null : comments.length === 1 ? (
            <Paper
              shadow={"md"}
              p="xs"
              radius={"md"}
              withBorder
              key={comments[0]!.id}
              className="my-4"
            >
              <h4 className="font-semibold">
                <Group position="left" spacing={"xs"}>
                  {comments[0]!.user.name}{" "}
                  <Avatar
                    src={comments[0]!.user.image}
                    size={"sm"}
                    radius={"lg"}
                  />
                </Group>
                <span className="text-xs">
                  {timeAgo(comments[0]!.createdAt)}
                </span>
              </h4>

              <p>{comments[0]!.content}</p>
            </Paper>
          ) : (
            comments.map((comment) => (
              <Paper
                shadow={"md"}
                p="xs"
                radius={"md"}
                withBorder
                key={comment.id}
                className="my-4"
              >
                <h4 className="font-semibold">
                  <Group position="left" spacing={"xs"}>
                    {comment.user.name}{" "}
                    <Avatar
                      src={comment.user.image}
                      size={"sm"}
                      radius={"lg"}
                    />
                  </Group>
                  <span className="text-xs">{timeAgo(comment.createdAt)}</span>
                </h4>

                <p>{comment.content}</p>
              </Paper>
            ))
          )}
        </Spoiler>
      </Card.Section>
    </Card>
  );
};

export default PostCard;
