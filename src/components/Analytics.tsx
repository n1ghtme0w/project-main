import React from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, subDays, isAfter, isBefore, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';

export function Analytics() {
  const { users, getCurrentBoardTasks, boards, currentBoardId } = useApp();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tasks = getCurrentBoardTasks();
  const currentBoard = boards.find(board => board.id === currentBoardId);
  const boardCreationDate = currentBoard ? new Date(currentBoard.createdAt) : new Date();

  // Статистика задач
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const createdTasks = tasks.filter(task => task.status === 'created').length;

  // Просроченные задачи
  const overdueTasks = tasks.filter(task => 
    task.deadline && isBefore(new Date(task.deadline), new Date()) && task.status !== 'completed'
  ).length;

  // Задачи, созданные за последние 7 дней
  const recentTasks = tasks.filter(task => 
    isAfter(new Date(task.createdAt), subDays(new Date(), 7))
  ).length;

  // Получение пользователей текущей доски
  const boardUsers = users.filter(user => user.boardIds.includes(currentBoardId || ''));

  // Статистика пользователей по задачам
  const userTaskStats = boardUsers.map(user => {
    const userTasks = tasks.filter(task => task.assigneeIds.includes(user.id));
    return {
      name: `${user.firstName} ${user.lastName}`,
      total: userTasks.length,
      completed: userTasks.filter(task => task.status === 'completed').length,
      inProgress: userTasks.filter(task => task.status === 'in-progress').length,
      created: userTasks.filter(task => task.status === 'created').length,
    };
  });

  // Процент выполнения
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Месячная статистика с момента создания доски
  const monthsFromCreation = eachMonthOfInterval({
    start: startOfMonth(boardCreationDate),
    end: new Date()
  });

  const monthlyStats = monthsFromCreation.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return taskDate >= monthStart && taskDate <= monthEnd;
    });

    return {
      month: format(month, 'MMM yyyy', { locale: ru }),
      total: monthTasks.length,
      completed: monthTasks.filter(task => task.status === 'completed').length,
      inProgress: monthTasks.filter(task => task.status === 'in-progress').length,
      created: monthTasks.filter(task => task.status === 'created').length,
    };
  });

  const StatCard = ({ icon: Icon, title, value, subtitle, color }: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 uppercase">{title}</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1 uppercase">{subtitle}</p>}
        </div>
        <div className={`p-2 md:p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="w-5 h-5 md:w-6 md:h-6" style={{ color: '#FFB3BA' }} />
        <h2 className="text-lg md:text-2xl font-bold text-gray-900 uppercase">АНАЛИТИКА ЗАДАЧ</h2>
      </div>

      {/* Обзорная статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <StatCard
          icon={CheckCircle2}
          title="ВСЕГО ЗАДАЧ"
          value={totalTasks}
          subtitle={`${completionRate}% ВЫПОЛНЕНО`}
          color="bg-blue-300"
        />
        <StatCard
          icon={TrendingUp}
          title="ВЫПОЛНЕНО"
          value={completedTasks}
          subtitle="ЗАВЕРШЕННЫЕ ЗАДАЧИ"
          color="bg-green-300"
        />
        <StatCard
          icon={Clock}
          title="В ПРОЦЕССЕ"
          value={inProgressTasks}
          subtitle="АКТИВНЫЕ ЗАДАЧИ"
          color="bg-yellow-300"
        />
        <StatCard
          icon={AlertTriangle}
          title="ПРОСРОЧЕНО"
          value={overdueTasks}
          subtitle="ТРЕБУЕТ ВНИМАНИЯ"
          color="bg-red-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Распределение по статусам */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-md md:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <PieChart className="w-4 h-4 md:w-5 md:h-5" style={{ color: '#FFDFBA' }} />
            <span className="uppercase">РАСПРЕДЕЛЕНИЕ ПО СТАТУСАМ</span>
          </h3>
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-300 rounded"></div>
                <span className="text-xs md:text-sm text-gray-700 uppercase">СОЗДАНО</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm font-medium text-gray-900">{createdTasks}</span>
                <div className="w-16 md:w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-300 h-2 rounded-full" 
                    style={{ width: `${totalTasks > 0 ? (createdTasks / totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded" style={{ backgroundColor: '#fcfba2' }}></div>
                <span className="text-xs md:text-sm text-gray-700 uppercase">В ПРОЦЕССЕ</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm font-medium text-gray-900">{inProgressTasks}</span>
                <div className="w-16 md:w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      backgroundColor: '#fcfba2',
                      width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-green-300 rounded"></div>
                <span className="text-xs md:text-sm text-gray-700 uppercase">ВЫПОЛНЕНО</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm font-medium text-gray-900">{completedTasks}</span>
                <div className="w-16 md:w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-300 h-2 rounded-full" 
                    style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Месячная статистика с визуальным представлением */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-md md:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 md:w-5 md:h-5" style={{ color: '#BAFFC9' }} />
            <span className="uppercase">СТАТИСТИКА ПО МЕСЯЦАМ</span>
          </h3>
          
          {/* Визуальное представление с диаграммами */}
          <div className="space-y-4 mb-4">
            {monthlyStats.slice(-6).map((stat, index) => {
              const maxTasks = Math.max(...monthlyStats.map(s => s.total));
              const barWidth = maxTasks > 0 ? (stat.total / maxTasks) * 100 : 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900 uppercase">{stat.month}</span>
                    <span className="text-gray-600">{stat.total} задач</span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-green-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Создано: {stat.created}</span>
                      <span>В процессе: {stat.inProgress}</span>
                      <span>Выполнено: {stat.completed}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Таблица для детальной информации */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-700 uppercase">МЕСЯЦ</th>
                  <th className="text-center py-2 font-medium text-gray-700 uppercase">ВСЕГО</th>
                  <th className="text-center py-2 font-medium text-gray-700 uppercase">ВЫПОЛНЕНО</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthlyStats.map((stat, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 text-gray-900 uppercase">{stat.month}</td>
                    <td className="text-center py-2 text-gray-900 font-medium">{stat.total}</td>
                    <td className="text-center py-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {stat.completed}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Производительность пользователей */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
        <h3 className="text-md md:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Users className="w-4 h-4 md:w-5 md:h-5" style={{ color: '#E6E6FA' }} />
          <span className="uppercase">ПРОИЗВОДИТЕЛЬНОСТЬ ПОЛЬЗОВАТЕЛЕЙ</span>
        </h3>
        
        {isMobile ? (
          // Мобильная версия - список
          <div className="space-y-3">
            {userTaskStats.map((user, index) => {
              const efficiency = user.total > 0 ? Math.round((user.completed / user.total) * 100) : 0;
              return (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {user.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 uppercase text-sm">{user.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{efficiency}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{user.total}</div>
                      <div className="text-gray-500 uppercase">ВСЕГО</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-600">{user.completed}</div>
                      <div className="text-gray-500 uppercase">ВЫПОЛНЕНО</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-blue-600">{user.inProgress}</div>
                      <div className="text-gray-500 uppercase">В ПРОЦЕССЕ</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          efficiency >= 80 ? 'bg-green-300' : 
                          efficiency >= 60 ? 'bg-yellow-300' : 'bg-red-300'
                        }`}
                        style={{ width: `${efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Десктопная версия - таблица
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200" style={{ backgroundColor: '#b6c2fc' }}>
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 uppercase">ПОЛЬЗОВАТЕЛЬ</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 uppercase">ВСЕГО</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 uppercase">ВЫПОЛНЕНО</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 uppercase">В ПРОЦЕССЕ</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 uppercase">СОЗДАНО</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 uppercase">ЭФФЕКТИВНОСТЬ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userTaskStats.map((user, index) => {
                  const efficiency = user.total > 0 ? Math.round((user.completed / user.total) * 100) : 0;
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {user.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 uppercase">{user.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 text-gray-900 font-medium">{user.total}</td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {user.completed}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          {user.inProgress}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {user.created}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Недавняя активность */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <h3 className="text-md md:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Calendar className="w-4 h-4 md:w-5 md:h-5" style={{ color: '#DDA0DD' }} />
          <span className="uppercase">НЕДАВНЯЯ АКТИВНОСТЬ</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-blue-600">{recentTasks}</div>
            <div className="text-xs md:text-sm text-blue-700 uppercase">ЗАДАЧ СОЗДАНО ЗА НЕДЕЛЮ</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-green-600">{completionRate}%</div>
            <div className="text-xs md:text-sm text-green-700 uppercase">ОБЩИЙ ПРОЦЕНТ ВЫПОЛНЕНИЯ</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-purple-600">{boardUsers.length}</div>
            <div className="text-xs md:text-sm text-purple-700 uppercase">УЧАСТНИКОВ ДОСКИ</div>
          </div>
        </div>
      </div>
    </div>
  );
}