import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Text, Card, Button, useTheme, IconButton, FAB } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/theme';
import { Appointment } from '../../types';
import { useAppointments } from '../../contexts/AppointmentContext';
import { appointmentService } from '../../services/appointmentService';

const AppointmentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const { appointments: allAppointments, removeAppointment, loading, refreshAppointments } = useAppointments();

  // Load upcoming and past appointments
  const loadAppointments = async () => {
    if (isLoadingAppointments) {
      return;
    }
    
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        setIsLoadingAppointments(true);
        setAppointmentsLoading(true);
        const [upcomingResponse, pastResponse] = await Promise.all([
          appointmentService.getUpcomingAppointments(20),
          appointmentService.getPastAppointments(20)
        ]);
        
        setUpcomingAppointments(upcomingResponse.appointments);
        setPastAppointments(pastResponse.appointments);
        break; 
      } catch (error) {
        retryCount++;
        console.error(`Error loading appointments (attempt ${retryCount}/${maxRetries}):`, error);
        
        if (retryCount === maxRetries) {
          console.error('Failed to load appointments after all retries');
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      } finally {
        setAppointmentsLoading(false);
        setIsLoadingAppointments(false);
      }
    }
  };

  // Handle edit appointment
  const handleEditAppointment = (appointment: Appointment) => {
    (navigation as any).navigate('AppointmentDetails', { 
      appointmentToEdit: appointment 
    });
  };

  // Handle copy past appointment to create new upcoming appointment
  const handleCopyPastAppointment = (appointment: Appointment) => {
    (navigation as any).navigate('AppointmentDetails', { 
      appointmentToCopy: appointment 
    });
  };

  // Handle delete appointment
  const handleDeleteAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Delete Appointment',
      `Are you sure you want to delete "${appointment.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeAppointment(appointment.id);
              await loadAppointments();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete appointment');
            }
          }
        }
      ]
    );
  };

  // Handle clear all past appointments
  const handleClearAllPastAppointments = () => {
    Alert.alert(
      'Clear All Past Appointments',
      'Are you sure you want to delete all past appointments? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              for (const appointment of pastAppointments) {
                await removeAppointment(appointment.id);
              }
              await loadAppointments();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete appointments');
            }
          }
        }
      ]
    );
  };

  // Filter appointments for selected date
  const selectedDateAppointments = allAppointments.filter(apt => {
    const selectedDateString = selectedDate.getFullYear() + '-' + 
      String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(selectedDate.getDate()).padStart(2, '0');
    return apt.date === selectedDateString;
  });

  // Load appointments 
  useEffect(() => {
    loadAppointments();
  }, []);

  // Refresh data when screen comes into focus 
  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        await refreshAppointments();
        await loadAppointments();
      };
      refreshData();
    }, [])
  );

  // Handle pull-to-refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshAppointments(),
        loadAppointments()
      ]);
    } catch (error) {
      console.error('Error refreshing appointments:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendarDays = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      calendarDays.push(date);
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <Card style={styles.calendarCard}>
        <Card.Content>
          <View style={styles.calendarHeader}>
            <IconButton
              icon="chevron-left"
              size={24}
              onPress={() => {
                const prevMonth = new Date(selectedDate);
                prevMonth.setMonth(prevMonth.getMonth() - 1);
                setSelectedDate(prevMonth);
              }}
            />
            <Text style={styles.calendarTitle}>
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <IconButton
              icon="chevron-right"
              size={24}
              onPress={() => {
                const nextMonth = new Date(selectedDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setSelectedDate(nextMonth);
              }}
            />
          </View>

          <View style={styles.weekDaysContainer}>
            {weekDays.map((day, index) => (
              <Text key={index} style={styles.weekDay}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth;
              const isToday = date.toDateString() === today.toDateString();
              const isSelected = date.toDateString() === selectedDate.toDateString();
                                                          const dateString = date.getFullYear() + '-' + 
                               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                               String(date.getDate()).padStart(2, '0');
                             const hasAppointment = allAppointments.some(
                               apt => apt.date === dateString
                             );

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    isCurrentMonth ? styles.currentMonthDay : styles.otherMonthDay,
                    isToday ? styles.today : (isSelected && styles.selectedDay),
                  ]}
                  onPress={() => setSelectedDate(date)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isCurrentMonth ? styles.currentMonthText : styles.otherMonthText,
                      isToday ? styles.todayText : (isSelected && styles.selectedDayText),
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  {hasAppointment && !isSelected && !isToday && <View style={styles.appointmentDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.contentWrapper}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Schedule Your Appointments
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Book & Manage Your Health Checkups
          </Text>
        </View>

        <View style={styles.content}>
          {renderCalendar()}

                     <Card style={styles.card}>
             <Card.Content style={styles.cardContent}>
               <Text variant="titleMedium" style={styles.cardTitle}>
                 Appointments for {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
               </Text>
               {selectedDateAppointments.length > 0 ? (
                 selectedDateAppointments.map((appointment) => (
                   <View key={appointment.id} style={styles.appointmentItem}>
                     <View style={styles.appointmentTime}>
                       <Text style={styles.timeText}>{appointment.time}</Text>
                       <Text style={styles.dateText}>{selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                     </View>
                     <View style={styles.appointmentDetails}>
                       <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                       {appointment.location && <Text style={styles.appointmentLocation}>{appointment.location}</Text>}
                       {appointment.notes && <Text style={styles.appointmentNotes}>{appointment.notes}</Text>}
                     </View>
                     <View style={styles.appointmentActions}>
                       <IconButton icon="pencil" size={16} onPress={() => handleEditAppointment(appointment)} />
                       <IconButton icon="delete" size={16} onPress={() => handleDeleteAppointment(appointment)} />
                     </View>
                   </View>
                 ))
               ) : (
                 <View style={styles.emptyState}>
                   <Text style={styles.emptyText}>No appointments for this date</Text>
                   <Text style={styles.emptySubtext}>Tap + to add an appointment</Text>
                 </View>
               )}
             </Card.Content>
           </Card>

           <Card style={styles.card}>
             <Card.Content style={styles.cardContent}>
               <Text variant="titleMedium" style={styles.cardTitle}>
                 Upcoming Appointments
               </Text>
               {appointmentsLoading ? (
                 <View style={styles.emptyState}>
                   <Text style={styles.emptyText}>Loading...</Text>
                 </View>
               ) : upcomingAppointments.length > 0 ? (
                 upcomingAppointments.map((appointment) => (
                   <View key={appointment.id} style={styles.appointmentItem}>
                     <View style={styles.appointmentTime}>
                       <Text style={styles.timeText}>{appointment.time}</Text>
                       <Text style={styles.dateText}>{new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                     </View>
                     <View style={styles.appointmentDetails}>
                       <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                       {appointment.location && <Text style={styles.appointmentLocation}>{appointment.location}</Text>}
                       {appointment.notes && <Text style={styles.appointmentNotes}>{appointment.notes}</Text>}
                     </View>
                     <View style={styles.appointmentActions}>
                       <IconButton icon="pencil" size={16} onPress={() => handleEditAppointment(appointment)} />
                       <IconButton icon="delete" size={16} onPress={() => handleDeleteAppointment(appointment)} />
                     </View>
                   </View>
                 ))
               ) : (
                 <View style={styles.emptyState}>
                   <Text style={styles.emptyText}>No upcoming appointments</Text>
                 </View>
               )}
             </Card.Content>
           </Card>

           <Card style={styles.card}>
             <Card.Content style={styles.cardContent}>
               <View style={styles.cardHeader}>
                 <Text variant="titleMedium" style={styles.cardTitle}>
                   Past Appointments
                 </Text>
                 {pastAppointments.length > 0 && (
                   <Button
                     mode="outlined"
                     onPress={handleClearAllPastAppointments}
                     icon="delete-sweep"
                     textColor={COLORS.textSecondary}
                     style={styles.clearAllButton}
                   >
                     Clear All
                   </Button>
                 )}
               </View>
               {appointmentsLoading ? (
                 <View style={styles.emptyState}>
                   <Text style={styles.emptyText}>Loading...</Text>
                 </View>
               ) : pastAppointments.length > 0 ? (
                 pastAppointments.map((appointment) => (
                   <View key={appointment.id} style={styles.appointmentItem}>
                     <View style={styles.appointmentTime}>
                       <Text style={styles.timeText}>{appointment.time}</Text>
                       <Text style={styles.dateText}>{new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                     </View>
                     <View style={styles.appointmentDetails}>
                       <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                       {appointment.location && <Text style={styles.appointmentLocation}>{appointment.location}</Text>}
                       {appointment.notes && <Text style={styles.appointmentNotes}>{appointment.notes}</Text>}
                     </View>
                     <View style={styles.appointmentActions}>
                       <IconButton icon="content-copy" size={16} onPress={() => handleCopyPastAppointment(appointment)} />
                       <IconButton icon="delete" size={16} onPress={() => handleDeleteAppointment(appointment)} />
                     </View>
                   </View>
                 ))
               ) : (
                 <View style={styles.emptyState}>
                   <Text style={styles.emptyText}>No past appointments</Text>
                 </View>
               )}
             </Card.Content>
           </Card>
        </View>
      </ScrollView>
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => (navigation as any).navigate('AppointmentDetails')}
        color={COLORS.white}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentWrapper: {
    flex: 1,
    paddingVertical: 40,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: COLORS.white,
  },
  title: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.primary,
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  calendarCard: {
    marginBottom: 20,
    elevation: 2,
    backgroundColor: COLORS.white,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  currentMonthDay: {
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  today: {
    backgroundColor: COLORS.primary,
    borderRadius: 25,
  },
  selectedDay: {
    backgroundColor: '#90CAF9', 
    borderRadius: 25,
  },
  dayText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  currentMonthText: {
    color: COLORS.textPrimary,
  },
  otherMonthText: {
    color: COLORS.textSecondary,
  },
  todayText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: COLORS.white, 
    fontWeight: 'bold',
  },
  appointmentDot: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'red',
  },
  card: {
    marginBottom: 16,
    elevation: 3,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearAllButton: {
    marginLeft: 8,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  cardDescription: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  appointmentTime: {
    marginRight: 20,
    alignItems: 'center',
    minWidth: 70,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  appointmentDetails: {
    flex: 1,
    marginRight: 12,
  },
  appointmentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  appointmentLocation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  appointmentNotes: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  appointmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    opacity: 0.8,
    fontWeight: '400',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
});

export default AppointmentScreen;
