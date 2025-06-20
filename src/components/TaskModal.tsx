import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Pin,
  Save,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Paperclip,
  Upload,
  Mic,
  Square,
  Play,
  Download,
  Pause,
} from 'lucide-react';
import { Task, User as UserType, Comment, Attachment, VoiceMessage } from '../types';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';

interface TaskModalProps {
  task?: Task;
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: Task['status'];
}

export function TaskModal({ task, isOpen, onClose, defaultStatus = 'created' }: TaskModalProps) {
  const { users, currentUser, addTask, updateTask, deleteTask, currentBoardId } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'medium' as Task['priority'],
    assigneeIds: [] as string[],
    deadline: '',
    isPinned: false,
  });
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Получение пользователей текущей доски
  const boardUsers = users.filter(user => user.boardIds.includes(currentBoardId || ''));

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeIds: task.assigneeIds || [],
        deadline: task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : '',
        isPinned: task.isPinned,
      });
      setComments(task.comments);
      setAttachments(task.attachments);
      setVoiceMessages(task.voiceMessages || []);
    } else {
      setFormData({
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'medium',
        assigneeIds: currentUser?.id ? [currentUser.id] : [],
        deadline: '',
        isPinned: false,
      });
      setComments([]);
      setAttachments([]);
      setVoiceMessages([]);
    }
    setNewAttachments([]);
    setHasUnsavedChanges(false);
  }, [task, currentUser, defaultStatus]);

  // Отслеживание изменений
  useEffect(() => {
    if (task) {
      const hasChanges = 
        formData.title !== task.title ||
        formData.description !== task.description ||
        formData.status !== task.status ||
        formData.priority !== task.priority ||
        JSON.stringify(formData.assigneeIds) !== JSON.stringify(task.assigneeIds || []) ||
        formData.deadline !== (task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : '') ||
        formData.isPinned !== task.isPinned ||
        newAttachments.length > 0 ||
        voiceMessages.length !== (task.voiceMessages || []).length ||
        comments.length !== task.comments.length;
      setHasUnsavedChanges(hasChanges);
    } else {
      const hasChanges = 
        formData.title !== '' ||
        formData.description !== '' ||
        formData.assigneeIds.length !== (currentUser?.id ? 1 : 0) ||
        formData.deadline !== '' ||
        formData.isPinned !== false ||
        newAttachments.length > 0 ||
        voiceMessages.length > 0;
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, newAttachments, voiceMessages, comments, task, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('НАЗВАНИЕ ЗАДАЧИ НЕ МОЖЕТ БЫТЬ ПУСТЫМ');
      return;
    }
    
    // Обработка вложений
    const processedAttachments = [
      ...attachments,
      ...newAttachments.map(file => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      }))
    ];
    
    const taskData = {
      ...formData,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      assigneeIds: formData.assigneeIds,
      creatorId: currentUser?.id || '',
      boardId: task?.boardId || currentBoardId || '1',
      attachments: processedAttachments,
      voiceMessages,
      comments,
    };

    if (task) {
      updateTask(task.id, taskData);
    } else {
      addTask(taskData);
    }

    setHasUnsavedChanges(false);
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('У ВАС ЕСТЬ НЕСОХРАНЕННЫЕ ИЗМЕНЕНИЯ. ВЫ УВЕРЕНЫ, ЧТО ХОТИТЕ ЗАКРЫТЬ?')) {
        setHasUnsavedChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      userId: currentUser?.id || '',
      content: newComment,
      createdAt: new Date().toISOString(),
    };

    setComments([...comments, comment]);
    setNewComment('');
  };

  const handleDelete = () => {
    if (task && window.confirm('ВЫ УВЕРЕНЫ, ЧТО ХОТИТЕ УДАЛИТЬ ЭТУ ЗАДАЧУ?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewAttachments(prev => [...prev, ...files]);
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const downloadAttachment = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const playAttachment = (attachment: Attachment) => {
    if (attachment.type.startsWith('audio/')) {
      const audio = new Audio(attachment.url);
      audio.play();
    } else if (attachment.type.startsWith('image/')) {
      window.open(attachment.url, '_blank');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const voiceMessage: VoiceMessage = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          userId: currentUser?.id || '',
          url: URL.createObjectURL(blob),
          duration: 0, // В реальном приложении здесь была бы длительность
          createdAt: new Date().toISOString(),
        };
        setVoiceMessages(prev => [...prev, voiceMessage]);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Ошибка при запуске записи:', error);
      alert('НЕ УДАЛОСЬ ПОЛУЧИТЬ ДОСТУП К МИКРОФОНУ');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const playVoiceMessage = (voiceMessage: VoiceMessage) => {
    if (playingVoice === voiceMessage.id) {
      setPlayingVoice(null);
      return;
    }
    
    setPlayingVoice(voiceMessage.id);
    const audio = new Audio(voiceMessage.url);
    audio.onended = () => setPlayingVoice(null);
    audio.play();
  };

  const removeVoiceMessage = (voiceId: string) => {
    setVoiceMessages(prev => prev.filter(vm => vm.id !== voiceId));
  };

  const applyTextFormat = (format: string) => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      case 'list':
        formattedText = `\n• ${selectedText}`;
        break;
      case 'ordered-list':
        formattedText = `\n1. ${selectedText}`;
        break;
      case 'align-left':
        formattedText = `<div style="text-align: left">${selectedText}</div>`;
        break;
      case 'align-center':
        formattedText = `<div style="text-align: center">${selectedText}</div>`;
        break;
      case 'align-right':
        formattedText = `<div style="text-align: right">${selectedText}</div>`;
        break;
      default:
        formattedText = selectedText;
    }

    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    setFormData({ ...formData, description: newValue });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const formatTextForDisplay = (text: string) => {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/\n• /g, '<br>• ')
      .replace(/\n\d+\. /g, '<br>$&')
      .replace(/\n/g, '<br>')
      .replace(/<div style="text-align: (left|center|right)">(.*?)<\/div>/g, '<div style="text-align: $1">$2</div>');
  };

  // Обработка множественного выбора пользователей
  const handleAssigneeChange = (userId: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, assigneeIds: [...formData.assigneeIds, userId] });
    } else {
      setFormData({ ...formData, assigneeIds: formData.assigneeIds.filter(id => id !== userId) });
    }
  };

  if (!isOpen) return null;

  const priorityLabels = {
    high: 'ВЫСОКИЙ',
    medium: 'СРЕДНИЙ',
    low: 'НИЗКИЙ',
  };

  const statusLabels = {
    created: 'СОЗДАНО',
    'in-progress': 'В ПРОЦЕССЕ',
    completed: 'ВЫПОЛНЕНО',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-center p-6 border-b border-gray-200 relative">
          <h2 className="text-xl font-semibold text-gray-900 uppercase">
            {task ? 'РЕДАКТИРОВАТЬ ЗАДАЧУ' : 'СОЗДАТЬ НОВУЮ ЗАДАЧУ'}
          </h2>
          <button
            onClick={handleClose}
            className="absolute right-6 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Название */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                НАЗВАНИЕ ЗАДАЧИ
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="ВВЕДИТЕ НАЗВАНИЕ ЗАДАЧИ..."
                required
              />
            </div>

            {/* Описание с форматированием */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                ОПИСАНИЕ
              </label>
              
              {/* Панель инструментов форматирования */}
              <div className="flex items-center space-x-1 mb-2 p-2 rounded-xl border" style={{ backgroundColor: '#a4d2fc' }}>
                <button
                  type="button"
                  onClick={() => applyTextFormat('bold')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                  title="ЖИРНЫЙ"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyTextFormat('italic')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                  title="КУРСИВ"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyTextFormat('underline')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                  title="ПОДЧЕРКНУТЫЙ"
                >
                  <Underline className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button
                  type="button"
                  onClick={() => applyTextFormat('list')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                  title="МАРКИРОВАННЫЙ СПИСОК"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyTextFormat('ordered-list')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                  title="НУМЕРОВАННЫЙ СПИСОК"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button
                  type="button"
                  onClick={() => applyTextFormat('align-left')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                  title="ПО ЛЕВОМУ КРАЮ"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyTextFormat('align-center')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                  title="ПО ЦЕНТРУ"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyTextFormat('align-right')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                  title="ПО ПРАВОМУ КРАЮ"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>

              <textarea
                ref={descriptionRef}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y min-h-[120px]"
                placeholder="ОПИШИТЕ ЗАДАЧУ..."
              />
              
              {/* Предварительный просмотр форматированного текста */}
              {formData.description && (
                <div className="mt-2 p-3 bg-gray-50 rounded-xl border">
                  <div className="text-sm text-gray-600 mb-1 uppercase">ПРЕДВАРИТЕЛЬНЫЙ ПРОСМОТР:</div>
                  <div 
                    className="text-sm text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatTextForDisplay(formData.description) }}
                  />
                </div>
              )}
            </div>

            {/* Вложения и голосовые сообщения */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                ВЛОЖЕНИЯ И ГОЛОСОВЫЕ СООБЩЕНИЯ
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors"
                    style={{ backgroundColor: '#a4d2fc' }}
                  >
                    <Upload className="w-4 h-4" />
                    <span className="uppercase">ПРИКРЕПИТЬ ФАЙЛЫ</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                      isRecording 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'hover:opacity-80'
                    }`}
                    style={!isRecording ? { backgroundColor: '#a4d2fc' } : {}}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4" />
                        <span className="uppercase">ОСТАНОВИТЬ ЗАПИСЬ</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span className="uppercase">ЗАПИСАТЬ ГОЛОС</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Голосовые сообщения */}
                {voiceMessages.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 uppercase">ГОЛОСОВЫЕ СООБЩЕНИЯ:</div>
                    {voiceMessages.map((voiceMessage) => {
                      const author = users.find(user => user.id === voiceMessage.userId);
                      return (
                        <div key={voiceMessage.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: '#a4d2fc', borderColor: '#b6c2fc' }}>
                          <div className="flex items-center space-x-2">
                            <Mic className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-800 uppercase">
                              ГОЛОСОВОЕ СООБЩЕНИЕ ОТ {author?.firstName} {author?.lastName}
                            </span>
                            <span className="text-xs text-blue-600 uppercase">
                              {format(new Date(voiceMessage.createdAt), 'dd.MM.yyyy HH:mm')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => playVoiceMessage(voiceMessage)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {playingVoice === voiceMessage.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeVoiceMessage(voiceMessage.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {/* Существующие вложения */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 uppercase px-3 py-1 rounded">СУЩЕСТВУЮЩИЕ ВЛОЖЕНИЯ:</div>
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: '#a4d2fc', borderColor: '#b6c2fc' }}>
                        <div className="flex items-center space-x-2">
                          <Paperclip className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-800 uppercase">{attachment.name}</span>
                          <span className="text-xs text-blue-600 uppercase">
                            ({(attachment.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {(attachment.type.startsWith('audio/') || attachment.type.startsWith('image/')) && (
                            <button
                              type="button"
                              onClick={() => playAttachment(attachment)}
                              className="text-blue-600 hover:text-blue-800"
                              title={attachment.type.startsWith('audio/') ? 'ВОСПРОИЗВЕСТИ' : 'ПРОСМОТРЕТЬ'}
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => downloadAttachment(attachment)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeExistingAttachment(attachment.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Новые вложения */}
                {newAttachments.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 uppercase">НОВЫЕ ВЛОЖЕНИЯ:</div>
                    {newAttachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700 uppercase">{file.name}</span>
                          <span className="text-xs text-gray-500 uppercase">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Статус, Приоритет и Закрепление */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                  СТАТУС
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors uppercase"
                >
                  <option value="created">{statusLabels.created}</option>
                  <option value="in-progress">{statusLabels['in-progress']}</option>
                  <option value="completed">{statusLabels.completed}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                  ПРИОРИТЕТ
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors uppercase"
                >
                  <option value="low">{priorityLabels.low}</option>
                  <option value="medium">{priorityLabels.medium}</option>
                  <option value="high">{priorityLabels.high}</option>
                </select>
              </div>
            </div>

            {/* Закрепление задачи */}
            <div className="flex items-center justify-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700 uppercase">ЗАКРЕПИТЬ ЗАДАЧУ</span>
                <Pin className="w-4 h-4 text-orange-600" />
              </label>
            </div>

            {/* Назначение пользователей и Срок выполнения */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                  НАЗНАЧИТЬ ПОЛЬЗОВАТЕЛЕЙ
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-xl p-3">
                  {boardUsers.map(user => (
                    <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.assigneeIds.includes(user.id)}
                        onChange={(e) => handleAssigneeChange(user.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 uppercase">
                        {user.firstName} {user.lastName} ({user.role.toUpperCase()})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                  СРОК ВЫПОЛНЕНИЯ
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  min={getTodayDate()}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Раздел комментариев */}
            {task && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 uppercase">
                  КОММЕНТАРИИ ({comments.length})
                </label>
                
                <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                  {comments.map((comment) => {
                    const commenter = users.find(user => user.id === comment.userId);
                    return (
                      <div key={comment.id} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {commenter?.firstName?.charAt(0).toUpperCase()}{commenter?.lastName?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900 uppercase">
                            {commenter?.firstName} {commenter?.lastName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.createdAt), 'dd.MM.yyyy, HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 ml-8 leading-relaxed">{comment.content}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="ДОБАВИТЬ КОММЕНТАРИЙ..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    className="px-4 py-2 text-gray-700 rounded-xl transition-colors text-sm font-medium uppercase"
                    style={{ backgroundColor: '#b6c2fc' }}
                  >
                    ДОБАВИТЬ
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Подвал */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center">
            {task && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center justify-center space-x-2 px-6 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium uppercase"
              >
                <Trash2 className="w-4 h-4" />
                <span>УДАЛИТЬ</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center justify-center px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium uppercase"
            >
              ОТМЕНА
            </button>
            
            <button
              onClick={handleSubmit}
              className="flex items-center justify-center space-x-2 text-white px-6 py-3 rounded-xl transition-all font-medium uppercase"
              style={{ backgroundColor: '#b6c2fc' }}
            >
              <Save className="w-4 h-4" />
              <span>{task ? 'ОБНОВИТЬ' : 'СОЗДАТЬ'} ЗАДАЧУ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}