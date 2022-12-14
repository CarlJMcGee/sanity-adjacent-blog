import { createRouter } from "./context";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { triggerEvent } from "../../utils/pusherStore";

export const PostRouter = createRouter()
  .query("getAll", {
    async resolve({ ctx }) {
      const Post = ctx.prisma.post;

      const posts = await Post.findMany({
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
              id: true,
              image: true,
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  name: true,
                  id: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: {
              userLikes: true,
            },
          },
        },
      });

      return posts;
    },
  })
  .mutation("getOne", {
    input: z.object({
      postId: z.string().trim(),
    }),
    async resolve({ ctx, input }) {
      const post = await ctx.prisma.post.findUniqueOrThrow({
        where: {
          id: input.postId,
        },
        include: {
          user: true,
        },
      });

      const {
        user: { password, ...userSafe },
        ...postData
      } = post;
      return { userSafe, ...postData };
    },
  })
  .mutation("new", {
    input: z.object({
      title: z.string().trim(),
      content: z.string().trim(),
      imageSrc: z.string().trim().optional(),
    }),
    async resolve({ ctx, input }) {
      const Post = ctx.prisma.post;
      const { title, content, imageSrc: imgLink } = input;

      if (!ctx.session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `User is not logged in!`,
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session?.user?.id },
      });
      if (!user?.canPost) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message:
            "User is not authorized to post. If you believe this is a mistake, please contact an admin.",
        });
      }

      const newPost = await Post.create({
        data: {
          title: title,
          content: content,
          image: imgLink,
          userId: ctx.session.user.id ?? "",
        },
      });

      await triggerEvent("main", "added_post", "added new post");
      return newPost;
    },
  })
  .mutation("update", {
    input: z.object({
      postId: z.string().trim(),
      title: z.string().trim(),
      content: z.string().trim(),
      imgLink: z.string().trim().optional(),
    }),
    async resolve({ ctx, input }) {
      const Post = ctx.prisma.post;
      const { title, content, imgLink, postId } = input;

      const update = await Post.update({
        data: {
          title: title,
          content: content,
          image: imgLink,
        },
        where: {
          id: postId,
        },
      });

      if (ctx.session?.user?.id !== update.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `User is not logged in!`,
        });
      }
      return `User updated post`;
    },
  })
  .mutation("addLike", {
    input: z.object({
      postId: z.string().trim(),
    }),
    async resolve({ ctx, input }) {
      const Likes = ctx.prisma.usersLikedPosts;
      const { postId } = input;

      if (ctx.session?.user) {
        const likePost = await Likes.create({
          data: {
            postId: postId,
            userId: ctx.session?.user?.id ?? "",
          },
        });

        if (!likePost) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "like post operation failed",
          });
        }

        await triggerEvent("main", "liked_post", "liked post");
        return `User liked post`;
      }
    },
  })
  .mutation("removeLike", {
    input: z.object({
      postId: z.string().trim(),
    }),
    async resolve({ ctx, input }) {
      const Likes = ctx.prisma.usersLikedPosts;
      const { postId } = input;

      if (ctx.session?.user) {
        const likePost = await Likes.delete({
          where: {
            userId_postId: {
              postId: postId,
              userId: ctx.session.user.id ?? "",
            },
          },
        });

        if (!likePost) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "remove post operation failed",
          });
        }

        await triggerEvent("main", "unliked_post", "unliked post");
        return `User unliked post`;
      }
    },
  })
  .query("getLikes", {
    input: z.object({
      postId: z.string(),
    }),
    async resolve({ ctx, input }) {
      const Posts = ctx.prisma.post;
      const { postId } = input;

      try {
        const post = await Posts.findUnique({
          where: {
            id: postId,
          },
          select: {
            _count: {
              select: {
                userLikes: true,
              },
            },
          },
        });

        if (!post || !post._count) {
          throw new TRPCError({ code: "NOT_FOUND", message: `Post not found` });
        }

        return post._count!.userLikes;
      } catch (err) {
        if (err) console.error(err);
      }
    },
  })
  .query("getComments", {
    input: z.object({
      postId: z.string(),
    }),
    async resolve({ ctx, input }) {
      const Posts = ctx.prisma.post;

      try {
        const post = await Posts.findUnique({
          where: {
            id: input.postId,
          },
          select: {
            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        });

        if (!post) {
          throw new TRPCError({ code: "NOT_FOUND", message: `post not found` });
        }

        return post.comments;
      } catch (err) {
        if (err) console.error(err);
      }
    },
  });
