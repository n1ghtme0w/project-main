import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { useApp } from '../context/AppContext';
import { Task } from '../types';

export function KanbanBoard() {
  const { users, updateTask, getCurrentBoardTasks } = useApp();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createInColumn, setCreateInColumn] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tasks = getCurrentBoardTasks();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const columns = [
    { id: 'created', title: 'К ВЫПОЛНЕНИЮ', color: 'blue' },
    { id: 'in-progress', title: 'В ПРОЦЕССЕ', color: 'yellow' },
    { id: 'completed', title: 'ВЫПОЛНЕНО', color: 'green' },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      setActiveTask(null);
      return;
    }

    // Определяем новый статус
    let newStatus: Task['status'];
    if (columns.some(col => col.id === over.id)) {
      newStatus = over.id as Task['status'];
    } else {
      // Если перетащили на другую задачу, определяем статус по колонке
      const targetTask = tasks.find(t => t.id === over.id);
      if (targetTask) {
        newStatus = targetTask.status;
      } else {
        setActiveTask(null);
        return;
      }
    }

    // Обновляем статус задачи
    updateTask(taskId, { status: newStatus });
    
    setActiveTask(null);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCreateTask = (columnId?: string) => {
    setSelectedTask(null);
    setCreateInColumn(columnId || null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    setCreateInColumn(null);
  };

  // Сортировка задач: закрепленные первыми, затем по приоритету (высокий, средний, низкий), затем по дате создания
  const sortTasks = (tasks: Task[]) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return [...tasks].sort((a, b) => {
      // Сначала закрепленные
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Затем по приоритету (высокий -> средний -> низкий)
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Затем по дате создания (новые первыми)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  // Мобильная версия - одна колонка на экран с горизонтальной прокруткой
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-180px)] overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full overflow-x-auto snap-x snap-mandatory">
            {columns.map((column) => {
              const columnTasks = sortTasks(
                tasks.filter(task => task.status === column.id)
              );

              return (
                <div key={column.id} className="flex-shrink-0 w-full snap-start px-4">
                  <KanbanColumn
                    id={column.id}
                    title={column.title}
                    tasks={columnTasks}
                    users={users}
                    onTaskClick={handleTaskClick}
                    onCreateTask={() => handleCreateTask(column.id)}
                    color={column.color}
                    isMobile={true}
                  />
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask}
                users={users}
                onClick={() => {}}
                className="rotate-3 opacity-90"
              />
            )}
          </DragOverlay>
        </DndContext>

        <TaskModal
          task={selectedTask || undefined}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          defaultStatus={createInColumn as Task['status'] || 'created'}
        />
      </div>
    );
  }

  // Десктопная версия - все колонки видны
  return (
    <div className="h-[calc(100vh-180px)] overflow-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex justify-center space-x-6 p-6 min-w-full h-full">
          {columns.map((column) => {
            const columnTasks = sortTasks(
              tasks.filter(task => task.status === column.id)
            );

            return (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={columnTasks}
                users={users}
                onTaskClick={handleTaskClick}
                onCreateTask={() => handleCreateTask(column.id)}
                color={column.color}
                isMobile={false}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && (
            <TaskCard
              task={activeTask}
              users={users}
              onClick={() => {}}
              className="rotate-3 opacity-90"
            />
          )}
        </DragOverlay>
      </DndContext>

      <TaskModal
        task={selectedTask || undefined}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        defaultStatus={createInColumn as Task['status'] || 'created'}
      />
    </div>
  );
}