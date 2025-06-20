import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  User as UserIcon,
  Edit,
  Trash2,
  Crown,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { User } from '../types';

export function UserManagement() {
  const { users, currentUser, addUser, updateUser, deleteUser, getCurrentBoardTasks, currentBoardId } = useApp();
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    patronymic: '',
    password: '',
    role: 'user' as 'admin' | 'user',
  });
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tasks = getCurrentBoardTasks();

  // Получение пользователей текущей доски
  const boardUsers = users.filter(user => user.boardIds.includes(currentBoardId || ''));

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.(ru|com|org|net|edu|gov|mil|int|info|biz|name|museum|coop|aero|[a-z]{2})$/i;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string): boolean => {
    return username.length >= 8 && username.length <= 30 && /^[a-zA-Z0-9]+$/.test(username);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8 && password.length <= 30 && /^[a-zA-Z0-9]+$/.test(password) && /[a-zA-Z]/.test(password);
  };

  const validateName = (name: string): boolean => {
    return name.length >= 2 && /^[a-zA-Zа-яА-Я]+$/.test(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateEmail(formData.email)) {
      setError('ПОЖАЛУЙСТА, ВВЕДИТЕ КОРРЕКТНЫЙ EMAIL АДРЕС');
      return;
    }

    if (!validateUsername(formData.username)) {
      setError('ИМЯ ПОЛЬЗОВАТЕЛЯ ДОЛЖНО СОДЕРЖАТЬ ОТ 8 ДО 30 СИМВОЛОВ И ТОЛЬКО АНГЛИЙСКИЕ БУКВЫ И ЦИФРЫ');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('ПАРОЛЬ ДОЛЖЕН СОДЕРЖАТЬ ОТ 8 ДО 30 СИМВОЛОВ, ТОЛЬКО АНГЛИЙСКИЕ БУКВЫ И ЦИФРЫ, И ХОТЯ БЫ ОДНУ БУКВУ');
      return;
    }

    if (!validateName(formData.firstName)) {
      setError('ИМЯ ДОЛЖНО СОДЕРЖАТЬ МИНИМУМ 2 СИМВОЛА И ТОЛЬКО БУКВЫ');
      return;
    }

    if (!validateName(formData.lastName)) {
      setError('ФАМИЛИЯ ДОЛЖНА СОДЕРЖАТЬ МИНИМУМ 2 СИМВОЛА И ТОЛЬКО БУКВЫ');
      return;
    }

    if (formData.patronymic && !validateName(formData.patronymic)) {
      setError('ОТЧЕСТВО ДОЛЖНО СОДЕРЖАТЬ ТОЛЬКО БУКВЫ');
      return;
    }
    
    if (editingUser) {
      // Проверка дубликатов при редактировании (исключая текущего пользователя)
      const existingUserByEmail = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase() && u.id !== editingUser.id);
      const existingUserByUsername = users.find(u => u.username.toLowerCase() === formData.username.toLowerCase() && u.id !== editingUser.id);
      
      if (existingUserByEmail) {
        setError('ПОЛЬЗОВАТЕЛЬ С ТАКИМ EMAIL УЖЕ СУЩЕСТВУЕТ');
        return;
      }
      
      if (existingUserByUsername) {
        setError('ПОЛЬЗОВАТЕЛЬ С ТАКИМ ИМЕНЕМ ПОЛЬЗОВАТЕЛЯ УЖЕ СУЩЕСТВУЕТ');
        return;
      }
      
      updateUser(editingUser.id, formData);
      setEditingUser(null);
      setShowAddUser(false);
    } else {
      const result = await addUser(formData);
      if (!result.success) {
        setError(result.message.toUpperCase());
        return;
      }
      setShowAddUser(false);
    }
    
    setFormData({ username: '', email: '', firstName: '', lastName: '', patronymic: '', password: '', role: 'user' });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      patronymic: user.patronymic || '',
      password: user.password,
      role: user.role,
    });
    setShowAddUser(true);
    setError('');
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUser?.id) {
      alert('ВЫ НЕ МОЖЕТЕ УДАЛИТЬ СВОЙ СОБСТВЕННЫЙ АККАУНТ.');
      return;
    }
    
    if (window.confirm(`ВЫ УВЕРЕНЫ, ЧТО ХОТИТЕ УДАЛИТЬ ${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()}?`)) {
      deleteUser(user.id);
    }
  };

  const getUserTaskStats = (userId: string) => {
    const userTasks = tasks.filter(task => task.assigneeIds?.includes(userId) || task.assigneeId === userId);
    return {
      total: userTasks.length,
      completed: userTasks.filter(task => task.status === 'completed').length,
      inProgress: userTasks.filter(task => task.status === 'in-progress').length,
    };
  };

  const cancelEdit = () => {
    setShowAddUser(false);
    setEditingUser(null);
    setFormData({ username: '', email: '', firstName: '', lastName: '', patronymic: '', password: '', role: 'user' });
    setError('');
  };

  // Мобильная версия - список пользователей
  if (isMobile) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 uppercase">ПОЛЬЗОВАТЕЛИ</h2>
          </div>
          
          <button
            onClick={() => setShowAddUser(true)}
            className="flex items-center space-x-1 text-gray-800 px-3 py-2 rounded-xl font-medium uppercase text-sm"
            style={{ backgroundColor: '#CFE8FF' }}
          >
            <UserPlus className="w-4 h-4" />
            <span>ДОБАВИТЬ</span>
          </button>
        </div>

        {/* Форма добавления/редактирования пользователя */}
        {showAddUser && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4 uppercase">
              {editingUser ? 'РЕДАКТИРОВАТЬ' : 'ДОБАВИТЬ ПОЛЬЗОВАТЕЛЯ'}
            </h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                  ИМЯ ПОЛЬЗОВАТЕЛЯ
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFE8FF] focus:border-[#CFE8FF] transition-colors"
                  placeholder="ВВЕДИТЕ ИМЯ ПОЛЬЗОВАТЕЛЯ"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                  EMAIL АДРЕС
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFE8FF] focus:border-[#CFE8FF] transition-colors"
                  placeholder="ВВЕДИТЕ EMAIL АДРЕС"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                    ИМЯ
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFE8FF] focus:border-[#CFE8FF] transition-colors"
                    placeholder="ИМЯ"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                    ФАМИЛИЯ
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFE8FF] focus:border-[#CFE8FF] transition-colors"
                    placeholder="ФАМИЛИЯ"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                  ОТЧЕСТВО (НЕОБЯЗАТЕЛЬНО)
                </label>
                <input
                  type="text"
                  value={formData.patronymic}
                  onChange={(e) => setFormData({ ...formData, patronymic: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFE8FF] focus:border-[#CFE8FF] transition-colors"
                  placeholder="ОТЧЕСТВО"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                  ПАРОЛЬ
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFE8FF] focus:border-[#CFE8FF] transition-colors"
                  placeholder="ВВЕДИТЕ ПАРОЛЬ"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                  РОЛЬ
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFE8FF] focus:border-[#CFE8FF] transition-colors uppercase"
                >
                  <option value="user">ПОЛЬЗОВАТЕЛЬ</option>
                  <option value="admin">АДМИНИСТРАТОР</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  className="text-gray-800 px-6 py-2 rounded-xl font-medium uppercase"
                  style={{ backgroundColor: '#CFE8FF' }}
                >
                  {editingUser ? 'ОБНОВИТЬ' : 'ДОБАВИТЬ'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-gray-600 hover:text-gray-800 px-6 py-2 rounded-xl hover:bg-gray-100 transition-colors font-medium uppercase"
                >
                  ОТМЕНА
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Список пользователей */}
        <div className="space-y-3">
          {boardUsers.map((user) => {
            const stats = getUserTaskStats(user.id);
            const isCurrentUser = user.id === currentUser?.id;
            
            return (
              <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-medium">
                      {user.firstName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center space-x-2">
                        <span className="uppercase">{user.firstName} {user.lastName}</span>
                        {isCurrentUser && (
                          <span className="text-xs px-2 py-1 rounded-full uppercase" style={{ backgroundColor: '#CFE8FF', color: '#1e40af' }}>
                            ВЫ
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role === 'admin' ? (
                          <Crown className="w-3 h-3" />
                        ) : (
                          <UserIcon className="w-3 h-3" />
                        )}
                        <span className="uppercase">
                          {user.role === 'admin' ? 'АДМИНИСТРАТОР' : 'ПОЛЬЗОВАТЕЛЬ'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        <div className="uppercase">{stats.total} ВСЕГО ЗАДАЧ</div>
                        <div className="text-green-600 uppercase">{stats.completed} ВЫПОЛНЕНО</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!isCurrentUser && (
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Десктопная версия - таблица
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 uppercase">УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ</h2>
          <span className="text-blue-700 px-3 py-1 rounded-full text-sm font-medium uppercase" style={{ backgroundColor: '#CFE8FF' }}>
            {boardUsers.length} ПОЛЬЗОВАТЕЛЕЙ
          </span>
        </div>
        
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center space-x-2 text-gray-800 px-4 py-2 rounded-xl font-medium uppercase"
          style={{ backgroundColor: '#CFE8FF' }}
        >
          <UserPlus className="w-5 h-5" />
          <span>ДОБАВИТЬ ПОЛЬЗОВАТЕЛЯ</span>
        </button>
      </div>

      {/* Форма добавления/редактирования пользователя */}
      {showAddUser && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 uppercase">
            {editingUser ? 'РЕДАКТИРОВАТЬ ПОЛЬЗОВАТЕЛЯ' : 'ДОБАВИТЬ НОВОГО ПОЛЬЗОВАТЕЛЯ'}
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                ИМЯ ПОЛЬЗОВАТЕЛЯ
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFE8FF] focus:border-[#CFE8FF] transition-colors"
                placeholder="ВВЕДИТЕ ИМЯ ПОЛЬЗОВАТЕЛЯ"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                EMAIL АДРЕС
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFE8FF] focus:border-[#CFE8FF] transition-colors"
                placeholder="ВВЕДИТЕ EMAIL АДРЕС"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                ИМЯ
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFE8FF] focus:border-[#CFE8FF] transition-colors"
                placeholder="ВВЕДИТЕ ИМЯ"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                ФАМИЛИЯ
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFE8FF] focus:border-[#CFE8FF] transition-colors"
                placeholder="ВВЕДИТЕ ФАМИЛИЮ"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                ОТЧЕСТВО (НЕОБЯЗАТЕЛЬНО)
              </label>
              <input
                type="text"
                value={formData.patronymic}
                onChange={(e) => setFormData({ ...formData, patronymic: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFE8FF] focus:border-[#CFE8FF] transition-colors"
                placeholder="ВВЕДИТЕ ОТЧЕСТВО"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                ПАРОЛЬ
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFE8FF] focus:border-[#CFE8FF] transition-colors"
                placeholder="ВВЕДИТЕ ПАРОЛЬ"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                РОЛЬ
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFE8FF] focus:border-[#CFE8FF] transition-colors uppercase"
              >
                <option value="user">ПОЛЬЗОВАТЕЛЬ</option>
                <option value="admin">АДМИНИСТРАТОР</option>
              </select>
            </div>

            <div className="flex items-end space-x-3">
              <button
                type="submit"
                className="text-gray-800 px-6 py-2 rounded-xl font-medium uppercase"
                style={{ backgroundColor: '#CFE8FF' }}
              >
                {editingUser ? 'ОБНОВИТЬ ПОЛЬЗОВАТЕЛЯ' : 'ДОБАВИТЬ ПОЛЬЗОВАТЕЛЯ'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-gray-600 hover:text-gray-800 px-6 py-2 rounded-xl hover:bg-gray-100 transition-colors font-medium uppercase"
              >
                ОТМЕНА
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Таблица пользователей */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200" style={{ backgroundColor: '#a4d2fc' }}>
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700 uppercase">ПОЛЬЗОВАТЕЛЬ</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700 uppercase">ВСЕГО</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700 uppercase">ВЫПОЛНЕНО</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700 uppercase">В ПРОЦЕССЕ</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700 uppercase">СОЗДАНО</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700 uppercase">ЭФФЕКТИВНОСТЬ</th>
                <th className="text-right py-4 px-6 font-medium text-gray-700 uppercase">ДЕЙСТВИЯ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {boardUsers.map((user) => {
                const stats = getUserTaskStats(user.id);
                const isCurrentUser = user.id === currentUser?.id;
                const efficiency = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-medium">
                          {user.firstName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center space-x-2">
                            <span className="uppercase">{user.firstName} {user.lastName}</span>
                            {isCurrentUser && (
                              <span className="text-xs px-2 py-1 rounded-full uppercase" style={{ backgroundColor: '#CFE8FF', color: '#1e40af' }}>
                                ВЫ
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role === 'admin' ? (
                              <Crown className="w-3 h-3" />
                            ) : (
                              <UserIcon className="w-3 h-3" />
                            )}
                            <span className="uppercase">
                              {user.role === 'admin' ? 'АДМИНИСТРАТОР' : 'ПОЛЬЗОВАТЕЛЬ'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900 font-medium">{stats.total}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {stats.completed}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        {stats.inProgress}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {stats.total - stats.completed - stats.inProgress}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              efficiency >= 80 ? 'bg-green-300' : 
                              efficiency >= 60 ? 'bg-yellow-300' : 'bg-red-300'
                            }`}
                            style={{ width: `${efficiency}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{efficiency}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}