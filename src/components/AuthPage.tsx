import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, User as UserIcon, Lock, Eye, EyeOff, FileText, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [patronymic, setPatronymic] = useState('');
  const [boardCode, setBoardCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register, joinBoardByCode, savedCredentials, clearSavedCredentials } = useApp();

  // Автозаполнение сохраненных данных
  useEffect(() => {
    if (savedCredentials && isLogin) {
      setUsername(savedCredentials.username);
      setPassword(savedCredentials.password);
    }
  }, [savedCredentials, isLogin]);

  // Получение кода доски из URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('board');
    if (code) {
      setBoardCode(code);
    }
  }, []);

  // Валидация пароля
  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8 || password.length > 30) {
      return { isValid: false, message: 'ПАРОЛЬ ДОЛЖЕН СОДЕРЖАТЬ ОТ 8 ДО 30 СИМВОЛОВ' };
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(password)) {
      return { isValid: false, message: 'ПАРОЛЬ ДОЛЖЕН СОДЕРЖАТЬ ТОЛЬКО АНГЛИЙСКИЕ БУКВЫ И ЦИФРЫ' };
    }
    
    if (!/[a-zA-Z]/.test(password)) {
      return { isValid: false, message: 'ПАРОЛЬ ДОЛЖЕН СОДЕРЖАТЬ ХОТЯ БЫ ОДНУ БУКВУ' };
    }
    
    return { isValid: true, message: '' };
  };

  // Валидация email
  const validateEmail = (email: string): { isValid: boolean; message: string } => {
    if (email.length < 8 || email.length > 50) {
      return { isValid: false, message: 'EMAIL ДОЛЖЕН СОДЕРЖАТЬ ОТ 8 ДО 50 СИМВОЛОВ' };
    }
    
    if (!/^[a-zA-Z0-9@.]+$/.test(email)) {
      return { isValid: false, message: 'EMAIL ДОЛЖЕН СОДЕРЖАТЬ ТОЛЬКО АНГЛИЙСКИЕ БУКВЫ, ЦИФРЫ И СИМВОЛЫ @ .' };
    }
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'ВВЕДИТЕ КОРРЕКТНЫЙ EMAIL АДРЕС' };
    }
    
    return { isValid: true, message: '' };
  };

  // Валидация имени
  const validateName = (name: string): { isValid: boolean; message: string } => {
    if (name.length < 2) {
      return { isValid: false, message: 'ИМЯ ДОЛЖНО СОДЕРЖАТЬ МИНИМУМ 2 СИМВОЛА' };
    }
    
    if (!/^[a-zA-Zа-яА-Я]+$/.test(name)) {
      return { isValid: false, message: 'ИМЯ ДОЛЖНО СОДЕРЖАТЬ ТОЛЬКО БУКВЫ' };
    }
    
    return { isValid: true, message: '' };
  };

  // Валидация username
  const validateUsername = (username: string): { isValid: boolean; message: string } => {
    if (username.length < 8 || username.length > 30) {
      return { isValid: false, message: 'ИМЯ ПОЛЬЗОВАТЕЛЯ ДОЛЖНО СОДЕРЖАТЬ ОТ 8 ДО 30 СИМВОЛОВ' };
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return { isValid: false, message: 'ИМЯ ПОЛЬЗОВАТЕЛЯ ДОЛЖНО СОДЕРЖАТЬ ТОЛЬКО АНГЛИЙСКИЕ БУКВЫ И ЦИФРЫ' };
    }
    
    return { isValid: true, message: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Валидация для входа
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.isValid) {
          setError(usernameValidation.message);
          setLoading(false);
          return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          setError(passwordValidation.message);
          setLoading(false);
          return;
        }

        const success = await login(username, password, boardCode);
        if (!success) {
          setError('НЕВЕРНОЕ ИМЯ ПОЛЬЗОВАТЕЛЯ ИЛИ ПАРОЛЬ');
        }
      } else {
        // Валидация для регистрации
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.isValid) {
          setError(usernameValidation.message);
          setLoading(false);
          return;
        }

        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
          setError(emailValidation.message);
          setLoading(false);
          return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          setError(passwordValidation.message);
          setLoading(false);
          return;
        }

        const firstNameValidation = validateName(firstName);
        if (!firstNameValidation.isValid) {
          setError(firstNameValidation.message);
          setLoading(false);
          return;
        }

        const lastNameValidation = validateName(lastName);
        if (!lastNameValidation.isValid) {
          setError(lastNameValidation.message);
          setLoading(false);
          return;
        }

        if (patronymic && patronymic.length > 0) {
          const patronymicValidation = validateName(patronymic);
          if (!patronymicValidation.isValid) {
            setError('ОТЧЕСТВО ' + patronymicValidation.message);
            setLoading(false);
            return;
          }
        }
        
        const success = await register({
          username,
          email,
          password,
          firstName,
          lastName,
          patronymic: patronymic || undefined,
        }, boardCode);
        
        if (!success) {
          setError('ПОЛЬЗОВАТЕЛЬ С ТАКИМ ИМЕНЕМ ИЛИ EMAIL УЖЕ СУЩЕСТВУЕТ');
        }
      }
    } catch (err) {
      setError('ПРОИЗОШЛА ОШИБКА. ПОПРОБУЙТЕ СНОВА.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role: 'admin' | 'user') => {
    setLoading(true);
    const demoUsername = role === 'admin' ? 'admin123' : 'user1234';
    await login(demoUsername, 'password123');
    setLoading(false);
  };

  const handleClearSavedData = () => {
    if (window.confirm('ВЫ УВЕРЕНЫ, ЧТО ХОТИТЕ УДАЛИТЬ СОХРАНЕННЫЕ ДАННЫЕ ДЛЯ АВТОЗАПОЛНЕНИЯ?')) {
      clearSavedCredentials();
      setUsername('');
      setPassword('');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/image22.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Полупрозрачный оверлей */}
      <div className="absolute inset-0 bg-white bg-opacity-30"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-600 rounded-2xl mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Planify</h1>
          <p className="text-gray-600">Планируйте проекты эффективно</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all ${
                isLogin
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{ backgroundColor: isLogin ? '#b6c2fc' : '#a4d2fc' }}
            >
              Вход
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all ${
                !isLogin
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{ backgroundColor: !isLogin ? '#b6c2fc' : '#a4d2fc' }}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Имя пользователя */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Имя пользователя
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Введите имя пользователя"
                  required
                />
                {savedCredentials && isLogin && (
                  <button
                    type="button"
                    onClick={handleClearSavedData}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                    title="Удалить сохраненные данные"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Email (только для регистрации) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email адрес
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Введите email"
                  required
                />
              </div>
            )}

            {/* Имя и фамилия (только для регистрации) */}
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Имя *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Введите имя"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Фамилия *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Введите фамилию"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Отчество (необязательно)
                  </label>
                  <input
                    type="text"
                    value={patronymic}
                    onChange={(e) => setPatronymic(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Введите отчество"
                  />
                </div>
              </>
            )}

            {/* Пароль */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Введите пароль"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Код доски */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Код доски (необязательно)
              </label>
              <input
                type="text"
                value={boardCode}
                onChange={(e) => setBoardCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Введите код доски"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-lg font-medium hover:opacity-90 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              style={{ backgroundColor: '#b6c2fc' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? (
                    <LogIn className="w-5 h-5" />
                  ) : (
                    <UserPlus className="w-5 h-5" />
                  )}
                  <span>{isLogin ? 'Войти' : 'Создать аккаунт'}</span>
                </>
              )}
            </button>
          </form>

          <div className="px-8 pb-8">
            <div className="text-center text-sm text-gray-500 mb-4">
              Или попробуйте демо аккаунты
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => demoLogin('admin')}
                disabled={loading}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Демо Админ
              </button>
              <button
                onClick={() => demoLogin('user')}
                disabled={loading}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Демо Пользователь
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}