import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Search, Heart, Brain, Zap, TriangleAlert as AlertTriangle, Phone } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { RequireAuth } from '../components/RequireAuth';

interface FirstAidTopic {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  severity: 'low' | 'medium' | 'high';
  steps: string[];
}

export default function FirstAidScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<FirstAidTopic | null>(null);

  const firstAidTopics: FirstAidTopic[] = [
    {
      id: '1',
      title: 'Heart Attack',
      category: 'Cardiac Emergency',
      icon: <Heart size={24} color={colors.primary[600]} />,
      severity: 'high',
      steps: [
        'Call emergency services immediately (911)',
        'Help the person sit down and rest',
        'Loosen any tight clothing',
        'If they have prescribed medication (like nitroglycerin), help them take it',
        'If they become unconscious and stop breathing, begin CPR',
        'Stay with them until help arrives'
      ]
    },
    {
      id: '2',
      title: 'Stroke',
      category: 'Neurological Emergency',
      icon: <Brain size={24} color={colors.primary[600]} />,
      severity: 'high',
      steps: [
        'Recognize signs: Face drooping, Arm weakness, Speech difficulty, Time to call 911',
        'Call emergency services immediately',
        'Note the time when symptoms first appeared',
        'Keep the person calm and lying down',
        'Do not give food, drink, or medication',
        'Monitor breathing and be ready to perform CPR if needed'
      ]
    },
    {
      id: '3',
      title: 'Seizure',
      category: 'Neurological Emergency',
      icon: <Zap size={24} color={colors.warning[600]} />,
      severity: 'medium',
      steps: [
        'Stay calm and time the seizure',
        'Clear the area of dangerous objects',
        'Do not hold the person down or put anything in their mouth',
        'Place them on their side if possible',
        'Call 911 if seizure lasts more than 5 minutes',
        'Stay with them until they are fully conscious'
      ]
    },
    {
      id: '4',
      title: 'Severe Bleeding',
      category: 'Trauma',
      icon: <AlertTriangle size={24} color={colors.primary[600]} />,
      severity: 'high',
      steps: [
        'Call emergency services if bleeding is severe',
        'Apply direct pressure to the wound with a clean cloth',
        'Elevate the injured area above the heart if possible',
        'Do not remove embedded objects',
        'Apply pressure to pressure points if direct pressure fails',
        'Treat for shock and monitor breathing'
      ]
    },
    {
      id: '5',
      title: 'Choking',
      category: 'Airway Emergency',
      icon: <AlertTriangle size={24} color={colors.primary[600]} />,
      severity: 'high',
      steps: [
        'Ask "Are you choking?" If they can speak, encourage coughing',
        'If they cannot speak, perform abdominal thrusts (Heimlich maneuver)',
        'Stand behind the person, wrap arms around their waist',
        'Make a fist above their navel, grasp with other hand',
        'Give quick, upward thrusts',
        'Call 911 if the person becomes unconscious'
      ]
    },
    {
      id: '6',
      title: 'Heat Stroke',
      category: 'Environmental Emergency',
      icon: <AlertTriangle size={24} color={colors.warning[600]} />,
      severity: 'high',
      steps: [
        'Call emergency services immediately',
        'Move person to a cool place',
        'Remove excess clothing',
        'Cool the person with wet cloths or ice packs',
        'Fan the person to increase cooling',
        'Monitor breathing and consciousness'
      ]
    },
    {
      id: '7',
      title: 'Hypothermia',
      category: 'Environmental Emergency',
      icon: <AlertTriangle size={24} color={colors.primary[600]} />,
      severity: 'high',
      steps: [
        'Call emergency services if severe',
        'Move to a warm, dry location',
        'Remove wet clothing',
        'Warm the person gradually with blankets',
        'Give warm, non-alcoholic drinks if conscious',
        'Monitor breathing and consciousness'
      ]
    },
    {
      id: '8',
      title: 'Diabetic Emergency',
      category: 'Metabolic Emergency',
      icon: <AlertTriangle size={24} color={colors.warning[600]} />,
      severity: 'medium',
      steps: [
        'Check if person is conscious and responsive',
        'If conscious and can swallow, give sugar or glucose tablets',
        'If unconscious, call 911 immediately',
        'Check for medical ID bracelet',
        'Monitor breathing and consciousness',
        'Stay with them until help arrives'
      ]
    },
    {
      id: '9',
      title: 'Anaphylaxis',
      category: 'Allergic Emergency',
      icon: <AlertTriangle size={24} color={colors.primary[600]} />,
      severity: 'high',
      steps: [
        'Call emergency services immediately',
        'Check for EpiPen and help administer if available',
        'Help person into comfortable position',
        'Loosen tight clothing',
        'Monitor breathing and consciousness',
        'Be prepared to perform CPR if needed'
      ]
    },
    {
      id: '10',
      title: 'Burns',
      category: 'Trauma',
      icon: <AlertTriangle size={24} color={colors.warning[600]} />,
      severity: 'medium',
      steps: [
        'Remove person from source of burn',
        'Cool burn under running water for 10-20 minutes',
        'Remove jewelry near burn if possible',
        'Cover with sterile dressing',
        'Do not pop blisters or apply creams',
        'Call 911 for severe burns'
      ]
    },
    {
      id: '11',
      title: 'Fracture',
      category: 'Trauma',
      icon: <AlertTriangle size={24} color={colors.warning[600]} />,
      severity: 'medium',
      steps: [
        'Call emergency services if severe',
        'Keep person still and calm',
        'Do not try to realign bones',
        'Immobilize the injured area',
        'Apply ice to reduce swelling',
        'Monitor for signs of shock'
      ]
    },
    {
      id: '12',
      title: 'Poisoning',
      category: 'Toxic Emergency',
      icon: <AlertTriangle size={24} color={colors.primary[600]} />,
      severity: 'high',
      steps: [
        'Call Poison Control Center (1-800-222-1222)',
        'Do not induce vomiting unless instructed',
        'Remove person from toxic substance',
        'Check breathing and consciousness',
        'Save container or substance for identification',
        'Call 911 if severe symptoms develop'
      ]
    }
  ];

  const filteredTopics = firstAidTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return colors.primary[600];
      case 'medium': return colors.warning[600];
      case 'low': return colors.success[600];
      default: return colors.gray[600];
    }
  };

  const TopicCard = ({ topic }: { topic: FirstAidTopic }) => (
    <TouchableOpacity
      style={styles.topicCard}
      onPress={() => setSelectedTopic(topic)}
    >
      <View style={styles.topicHeader}>
        <View style={styles.topicIcon}>
          {topic.icon}
        </View>
        <View style={styles.topicInfo}>
          <Text style={styles.topicTitle}>{topic.title}</Text>
          <Text style={styles.topicCategory}>{topic.category}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(topic.severity) }]}>
          <Text style={styles.severityText}>
            {topic.severity.toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const TopicDetail = ({ topic }: { topic: FirstAidTopic }) => (
    <ScrollView style={styles.detailView}>
      <View style={styles.detailHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedTopic(null)}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.detailTitle}>
          {topic.icon}
          <Text style={styles.detailTitleText}>{topic.title}</Text>
        </View>

        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(topic.severity) }]}>
          <Text style={styles.severityText}>{topic.severity.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.emergencyCallout}>
        <Phone size={20} color={colors.white} />
        <Text style={styles.emergencyText}>
          For life-threatening emergencies, call 911 immediately
        </Text>
      </View>

      <View style={styles.stepsContainer}>
        <Text style={styles.stepsTitle}>Emergency Steps:</Text>
        {topic.steps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  if (selectedTopic) {
    return (
      <RequireAuth fallbackMessage="Please sign in to access first aid information">
        <SafeAreaView style={styles.container}>
          <TopicDetail topic={selectedTopic} />
        </SafeAreaView>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth fallbackMessage="Please sign in to access first aid information">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>First Aid Guide</Text>
          <Text style={styles.subtitle}>Emergency medical guidance</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={20} color={colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search first aid topics..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.gray[400]}
            />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.emergencyBanner}>
            <Phone size={20} color={colors.white} />
            <Text style={styles.emergencyBannerText}>
              In a life-threatening emergency, call 911 first!
            </Text>
          </View>

          <View style={styles.topicsList}>
            {filteredTopics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerTitle}>Important Disclaimer</Text>
            <Text style={styles.disclaimerText}>
              This information is for educational purposes only and should not replace professional medical advice.
              Always call emergency services for serious medical emergencies.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.gray[600],
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.gray[900],
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  emergencyBannerText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  topicsList: {
    gap: 12,
  },
  topicCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  topicCategory: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.gray[600],
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: colors.white,
  },
  disclaimer: {
    marginTop: 32,
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.warning[50],
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
  },
  disclaimerTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.warning[800],
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.warning[700],
    lineHeight: 16,
  },
  detailView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  detailHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.secondary[600],
  },
  detailTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailTitleText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.gray[900],
    marginLeft: 12,
  },
  emergencyCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    margin: 24,
    padding: 16,
    borderRadius: 12,
  },
  emergencyText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
    flex: 1,
  },
  stepsContainer: {
    padding: 24,
  },
  stepsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.gray[900],
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: colors.white,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.gray[700],
    lineHeight: 20,
  },
});