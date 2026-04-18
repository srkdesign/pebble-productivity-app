/* eslint-disable jsx-a11y/no-autofocus */
import { useState } from "react";
import { createProject, updateProject, deleteProject } from "@api/projects";
import {
  Card,
  ColorArea,
  ColorSlider,
  ColorSwatch,
  Disclosure,
  Modal,
  Button,
  ButtonGroup,
  useOverlayState,
  Input,
  TextField,
  Label,
  toast,
} from "@heroui/react";
import {
  Plus,
  EditIcon,
  TrashBin,
  ExpandSidebarIcon,
  CollapseSidebarIcon,
} from "@icons";

export default function ProjectSidebar({
  projects,
  active,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}: any) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6566f1");
  const [collapsed, setCollapsed] = useState(false);

  const createState = useOverlayState();
  const editState = useOverlayState();
  const deleteState = useOverlayState();

  // ✅ Single state for both edit and delete
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6366f1");

  const submit = async (close: () => void) => {
    if (!name.trim()) return;
    try {
      const project = await createProject(name, color);

      onCreate(project);
      setName("");
      close();
      toast.success(`Project "${project.name}" created`, { timeout: 3000 });
    } catch (err) {
      toast(`Failed to create project: ${err}`, {
        variant: "danger",
        timeout: 3000,
      });
    }
  };

  const openEdit = (p: any) => {
    setSelectedProject(p);
    setEditName(p.name ?? "");
    setEditColor(p.color ?? "#6366f1");
    editState.open();
  };

  const submitEdit = async (close: () => void) => {
    if (!editName.trim()) return;
    try {
      const updated = await updateProject(selectedProject.id, {
        name: editName,
        color: editColor,
      });

      onUpdate(updated);
      close();
    } catch (err) {
      toast(`Failed to update project: ${err}`, {
        variant: "danger",
        timeout: 3000,
      });
    }
  };

  const handleDelete = async (close: () => void) => {
    if (!selectedProject) return;
    try {
      await deleteProject(selectedProject.id);
      onDelete(selectedProject.id);
      setSelectedProject(null);
      close();
    } catch (err) {
      toast(`Failed to delete project: ${err}`, {
        variant: "danger",
        timeout: 3000,
      });
    }
  };

  return (
    <Card
      className={`md:sticky md:top-6 md:left-0 md:h-[calc(100dvh-6.75rem)] transition-all duration-300 ${
        collapsed ? "md:w-16" : "md:w-64"
      } shadow-none rounded-3xl *:h-full`}
    >
      <Card.Content>
        <div
          className={`flex flex-col h-full gap-2 overflow-hidden md:overflow-visible ${
            collapsed ? "" : "pt-1.5 px-1"
          }`}
        >
          {/* Header */}
          <div
            className={`flex flex-row items-center justify-between ${
              collapsed ? "md:flex-col" : "items-center justify-between"
            }`}
          >
            <h2
              className={`text-xl md:text-lg font-bold tracking-tight ${
                collapsed ? "md:hidden md:opacity-0" : ""
              }`}
            >
              Projects
            </h2>
            <div
              className={`flex ${
                collapsed ? "md:flex-col" : "flex-row"
              } items-center gap-2`}
            >
              <Button
                isIconOnly
                className="rounded-full [&_svg]:size-5.5"
                variant="primary"
                onPress={createState.open}
              >
                <Plus color="currentColor" size={24} />
              </Button>
              <Button
                isIconOnly
                className="rounded-full [&_svg]:size-5"
                variant="secondary"
                onPress={() => setCollapsed((prev) => !prev)}
              >
                {collapsed ? (
                  <ExpandSidebarIcon color="currentColor" size={24} />
                ) : (
                  <CollapseSidebarIcon color="currentColor" size={24} />
                )}
              </Button>
            </div>
          </div>

          {/* Project list */}
          {collapsed ? (
            <div className="flex md:flex-col h-full items-center gap-3 mt-2 overflow-auto md:overflow-visible">
              {projects.map((p: any) => (
                <Button
                  key={p.id}
                  isIconOnly
                  variant={active === p.id ? "secondary" : "tertiary"}
                  onPress={() => onSelect(p.id)}
                >
                  <span
                    className="w-2 h-2 rounded-full transition-transform hover:scale-125"
                    style={{ backgroundColor: p.color ?? "#6366f1" }}
                    title={p.name}
                  />
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-2 h-full flex-1 overflow-hidden overflow-y-auto mt-2">
              {projects.map((p: any) => (
                <div key={p.id} className="group relative">
                  <Button
                    fullWidth
                    className="justify-start! rounded-xl min-h-11"
                    size="lg"
                    variant={active === p.id ? "secondary" : "ghost"}
                    onPress={() => onSelect(p.id)}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </Button>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
                    <ButtonGroup className="rounded-none gap-1 *:rounded-full">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="secondary"
                        onPress={() => openEdit(p)}
                      >
                        <EditIcon color="currentColor" size={20} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="danger-soft"
                        onPress={() => {
                          setSelectedProject(p);
                          deleteState.open();
                        }}
                      >
                        <TrashBin color="currentColor" size={20} />
                      </Button>
                    </ButtonGroup>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card.Content>

      {/* Create modal */}
      <Modal state={createState}>
        <Modal.Backdrop>
          <Modal.Container placement="center">
            <Modal.Dialog className="border-none">
              {({ close }) => (
                <>
                  <Modal.Header className="flex items-baseline">
                    <Modal.Heading>New Project</Modal.Heading>
                    <Modal.CloseTrigger />
                  </Modal.Header>
                  <Modal.Body className="flex flex-col gap-4 overflow-visible pt-4">
                    <TextField
                      autoFocus
                      aria-label="Project name"
                      className="gap-2 [&_input]:h-11"
                      value={name}
                      variant="secondary"
                      onChange={setName}
                    >
                      <Input placeholder="Project name" />
                    </TextField>
                    <Disclosure className="hover:dark:bg-zinc-800 hover:bg-zinc-100 px-2.5 py-1.5 rounded-xl">
                      <Disclosure.Heading>
                        <Disclosure.Trigger className="flex items-center gap-3 w-full py-1">
                          <ColorSwatch
                            className="size-6 rounded-full shrink-0"
                            color={color}
                          />
                          <div className="flex gap-2 items-baseline">
                            <Label className="cursor-pointer">
                              Project Color
                            </Label>
                            <span className="text-xs text-muted font-mono ml-1">
                              {color.toUpperCase()}
                            </span>
                          </div>
                          <Disclosure.Indicator className="ml-auto" />
                        </Disclosure.Trigger>
                      </Disclosure.Heading>
                      <Disclosure.Content>
                        <Disclosure.Body className="flex flex-col gap-3 pt-3">
                          <ColorArea
                            className="max-w-none w-full rounded-md"
                            colorSpace="hsb"
                            value={color}
                            xChannel="saturation"
                            yChannel="brightness"
                            onChange={(c) => setColor(c.toString("hex"))}
                          >
                            <ColorArea.Thumb className="bg-none shadow-none rounded-full" />
                          </ColorArea>
                          <ColorSlider
                            channel="hue"
                            colorSpace="hsb"
                            value={color}
                            onChange={(c) => setColor(c.toString("hex"))}
                          >
                            <ColorSlider.Track>
                              <ColorSlider.Thumb />
                            </ColorSlider.Track>
                          </ColorSlider>
                        </Disclosure.Body>
                      </Disclosure.Content>
                    </Disclosure>
                  </Modal.Body>
                  <Modal.Footer className="flex *:w-full">
                    <Button variant="tertiary" onPress={close}>
                      Cancel
                    </Button>
                    <Button variant="primary" onPress={() => submit(close)}>
                      Create
                    </Button>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Edit modal */}
      <Modal state={editState}>
        <Modal.Backdrop>
          <Modal.Container className="border-none" placement="center">
            <Modal.Dialog className="border-none">
              {({ close }) => (
                <>
                  <Modal.Header>
                    <Modal.Heading>Edit Project</Modal.Heading>
                    <Modal.CloseTrigger />
                  </Modal.Header>
                  <Modal.Body className="flex flex-col gap-4 overflow-visible pt-4 border-none">
                    <TextField
                      autoFocus
                      aria-label="Project name"
                      className="gap-2 [&_input]:h-11"
                      value={editName}
                      variant="secondary"
                      onChange={setEditName}
                    >
                      <Input placeholder="Project name" />
                    </TextField>
                    <Disclosure className="hover:dark:bg-zinc-800 hover:bg-zinc-100 px-2.5 py-1.5 rounded-xl">
                      <Disclosure.Heading>
                        <Disclosure.Trigger className="flex items-center gap-3 w-full py-1">
                          <ColorSwatch
                            className="size-6 rounded-md shrink-0"
                            color={editColor}
                          />
                          <div className="flex gap-2 items-baseline">
                            <Label className="cursor-pointer">
                              Project Color
                            </Label>
                            <span className="text-xs text-muted font-mono ml-1">
                              {editColor.toUpperCase()}
                            </span>
                          </div>
                          <Disclosure.Indicator className="ml-auto" />
                        </Disclosure.Trigger>
                      </Disclosure.Heading>
                      <Disclosure.Content>
                        <Disclosure.Body className="flex flex-col gap-3 pt-3">
                          <ColorArea
                            className="max-w-none w-full rounded-md"
                            colorSpace="hsb"
                            value={editColor}
                            xChannel="saturation"
                            yChannel="brightness"
                            onChange={(c) => setEditColor(c.toString("hex"))}
                          >
                            <ColorArea.Thumb className="bg-none shadow-none" />
                          </ColorArea>
                          <ColorSlider
                            channel="hue"
                            colorSpace="hsb"
                            value={editColor}
                            onChange={(c) => setEditColor(c.toString("hex"))}
                          >
                            <ColorSlider.Track>
                              <ColorSlider.Thumb />
                            </ColorSlider.Track>
                          </ColorSlider>
                        </Disclosure.Body>
                      </Disclosure.Content>
                    </Disclosure>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="tertiary" onPress={close}>
                      Cancel
                    </Button>
                    <Button variant="primary" onPress={() => submitEdit(close)}>
                      Save
                    </Button>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Delete modal */}
      <Modal state={deleteState}>
        <Modal.Backdrop>
          <Modal.Container placement="center">
            <Modal.Dialog>
              {({ close }) => (
                <>
                  <Modal.Header>
                    <Modal.Heading>
                      Are you sure you want to delete &quot;
                      {selectedProject?.name}&quot;?
                    </Modal.Heading>
                    <Modal.CloseTrigger />
                  </Modal.Header>
                  <Modal.Footer>
                    <Button variant="tertiary" onPress={close}>
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      onPress={() => handleDelete(close)}
                    >
                      Delete
                    </Button>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Card>
  );
}
