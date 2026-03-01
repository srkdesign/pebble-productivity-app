import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  ButtonGroup,
  useDisclosure,
  Input,
  addToast,
} from "@heroui/react";

import { createProject, updateProject, deleteProject } from "../api/projects";
import Plus from "../icons/Plus";
import EditIcon from "../icons/Edit";

import TrashBin from "@/icons/TrashBin";
import ExpandSidebarIcon from "@/icons/ExpandSidebar";
import CollapseSidebarIcon from "@/icons/CollapseSidebar";

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
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const submit = async (onClose: () => void) => {
    if (!name.trim()) return;
    try {
      const project = await createProject(name, color);

      onCreate(project);
      setName("");
      onClose();
      addToast({
        title: "Success",
        description: `Project "${project.name}" created`,
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
    } catch (err) {
      addToast({
        title: "Error",
        description: `Failed to create project because of following error: ${err}`,
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
    }
  };

  const [editProject, setEditProject] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6366f1");
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onOpenChange: onEditOpenChange,
  } = useDisclosure();

  const openEdit = (p: any) => {
    setEditProject(p);
    setEditName(p.name ?? "");
    setEditColor(p.color ?? "#6366f1");
    onEditOpen();
  };

  const submitEdit = async (onClose: () => void) => {
    if (!editName.trim()) return;
    const updated = await updateProject(editProject.id, {
      name: editName,
      color: editColor,
    });
    onUpdate(updated);
    onClose();
  };

  const handleDelete = async (p: any) => {
    if (!confirm(`Delete project "${p.name}"?`)) return;
    await deleteProject(p.id);
    onDelete(p.id); // pass this prop from parent
  };

  return (
    <Card
      className={`md:sticky top-6 left-0 md:m-6 m-2 md:h-[calc(100dvh-7rem)] transition-all duration-300 ${collapsed ? "md:w-16" : "md:w-64"}`}
      shadow="none"
    >
      <CardBody>
        <div className="flex flex-col p-2 gap-2 overflow-hidden md:overflow-visible">
          {/* Header */}
          <div
            className={`flex flex-row items-center justify-between ${collapsed ? "md:flex-col " : "items-center justify-between"}`}
          >
            <h2
              className={`text-xl md:text-lg font-bold ${collapsed ? "md:hidden md:opacity-0" : ""}`}
            >
              Projects
            </h2>
            <div
              className={`flex ${collapsed ? "md:flex-col" : "flex-row"} items-center gap-2`}
            >
              <Button
                isIconOnly
                color="primary"
                variant="solid"
                onPress={onOpen}
              >
                <Plus color="currentColor" size={24} />
              </Button>
              <Button
                isIconOnly
                variant="flat"
                onPress={() => setCollapsed((prev) => !prev)}
              >
                {collapsed ? (
                  <ExpandSidebarIcon color="currentColor" size={22} />
                ) : (
                  <CollapseSidebarIcon color="currentColor" size={22} />
                )}
              </Button>
            </div>
          </div>

          {/* Project list */}
          {collapsed ? (
            <div className="flex md:flex-col items-center gap-3 mt-2 overflow-auto md:overflow-visible">
              {projects.map((p: any) => (
                <Button
                  key={p.id}
                  isIconOnly
                  variant={active === p.id ? "flat" : "light"}
                  onPress={() => onSelect(p.id)}
                >
                  <span
                    key={p.id}
                    className="w-2 h-2 rounded-full transition-transform hover:scale-125"
                    style={{ backgroundColor: p.color ?? "#6366f1" }}
                    title={p.name}
                  />
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-auto mt-2">
              {projects.map((p: any) => (
                <div key={p.id} className="group relative">
                  <Button
                    fullWidth
                    className="!justify-start"
                    size="lg"
                    variant={active === p.id ? "flat" : "light"}
                    onPress={() => onSelect(p.id)}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </Button>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-zinc-800 rounded-lg">
                    <ButtonGroup>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => openEdit(p)}
                      >
                        <EditIcon color="currentColor" size={20} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleDelete(p)}
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
      </CardBody>

      {/* Create modal */}
      <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>New Project</ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  label="Project Name"
                  placeholder="Enter project name"
                  value={name}
                  onValueChange={setName}
                />
                <Input
                  label="Project Color"
                  value={color}
                  onValueChange={setColor}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={() => submit(onClose)}>
                  Create
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={isEditOpen}
        placement="top-center"
        onOpenChange={onEditOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Edit Project</ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  label="Project Name"
                  value={editName}
                  onValueChange={setEditName}
                />
                <Input
                  label="Project Color"
                  value={editColor}
                  onValueChange={setEditColor}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={() => submitEdit(onClose)}>
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Card>
  );
}
