import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  Drawer,
  Group,
  Menu,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import SignupForm from "../signupForm";
import { IconChevronDown } from "@tabler/icons";
import { trpc } from "../../utils/trpc";
import UpdateInfoForm from "../updateInfo";

export interface IHeaderProps {
  sess: Session | null;
}

export default function Header({ sess }: IHeaderProps) {
  const [drawerOpened, setDrawer] = React.useState(false);
  const [updateOpen, setUpdateOpen] = React.useState(false);
  const [updateField, setUpdateField] = React.useState<"name" | "pfp">("name");

  const { mutate: updateName } = trpc.useMutation(["user.updateName"]);
  const { mutate: updatePfp } = trpc.useMutation(["user.updatePfp"]);

  // handler
  // TODO: add "updateModalHandler" with "event: React.MouseEvent<HTMLElement>" and "updateField" as params

  // not logged in
  if (!sess?.user) {
    return (
      <>
        <Box>
          <Group position="apart" className="m-5">
            <Title
              order={1}
              size={50}
              className="text-palette-grey-dark text-shadow-lg shadow-palette-green-dark"
            >
              Sanity Adjacent
            </Title>
            <Group position="center" className="mx-10">
              <Button
                variant="filled"
                color={"cyan"}
                className="bg-palette-blue-dark"
                onClick={() => signIn()}
              >
                Log in
              </Button>
              <Button
                variant="filled"
                color={"cyan"}
                className="bg-palette-blue-dark"
                onClick={() => setDrawer(true)}
              >
                Sign Up
              </Button>
            </Group>
          </Group>
        </Box>

        <Drawer
          opened={drawerOpened}
          onClose={() => setDrawer(false)}
          title="Register"
          padding={"xl"}
          size="xl"
          position="top"
        >
          <SignupForm />
        </Drawer>
      </>
    );
  }

  // logged in
  return (
    <Box>
      <Group position="apart" className="m-5">
        <Title
          order={1}
          size={50}
          className="text-palette-grey-dark text-shadow-lg shadow-palette-green-dark"
        >
          Sanity Adjacent
        </Title>
        <Group position="center" className="mx-10">
          <Menu
            shadow={"lg"}
            width={200}
            position="bottom"
            closeOnClickOutside
            trigger={window.innerWidth >= 1024 ? "hover" : "click"}
          >
            <Menu.Target>
              <UnstyledButton>
                <Group position="apart">
                  <Avatar src={sess.user.image} radius={"lg"} size={"md"} />
                  <Text size={25} className="text-palette-grey-dark font-bold">
                    {sess?.user?.name}
                  </Text>
                  <IconChevronDown />
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              // TODO: add onClick for updateModalHandler with "name"
              <Menu.Item color={"green"} className="text-center">
                Change Username
              </Menu.Item>
              // TODO: add onClick for updateModalHandler
              <Menu.Item color={"green"} className="text-center">
                Change
                <br />
                Profile Picture
              </Menu.Item>
              <Menu.Item
                color={"cyan"}
                className="text-center"
                onClick={() => signOut()}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
      <UpdateInfoForm
        updateField={updateField}
        openned={updateOpen}
        setOpenned={setUpdateOpen}
      />
    </Box>
  );
}
