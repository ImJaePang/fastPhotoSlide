import React from 'react';
import { View, Text, Modal, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/themes';
import { Button, Card } from './ui';

const SECTIONS = [
  {
    title: '시작하기',
    items: [
      '처음 실행하면 사진/동영상 접근 권한을 요청합니다. 허용해야 앨범을 불러올 수 있습니다.',
      '재생할 앨범을 고르면 슬라이드쇼가 바로 시작됩니다. 다음 실행부터는 마지막 앨범이 자동으로 재생됩니다.',
    ],
  },
  {
    title: '화면 조작',
    items: [
      '화면 가운데를 탭하면 설정 창이 열립니다. (10초간 조작이 없으면 자동으로 닫힘)',
      '화면 왼쪽/오른쪽 가장자리를 탭하거나 좌우로 스와이프하면 이전/다음 슬라이드로 이동합니다.',
      '설정 창의 "일시정지"로 자동 전환을 멈추고, "재생"으로 다시 시작합니다.',
    ],
  },
  {
    title: '사진과 영상',
    items: [
      '가로 사진은 화면을 꽉 채워 보여 줍니다.',
      '화면보다 긴 세로 사진은 위에서 아래로 일정한 속도로 천천히 스크롤됩니다. 슬라이드 간격이 짧으면 끝까지 보여 주기 위해 표시 시간이 자동으로 늘어납니다.',
      '동영상은 소리 없이 자동 재생됩니다. 슬라이드 간격보다 짧으면 반복하고, 길면 끝까지 재생한 뒤 넘어갑니다.',
      '지원 형식: JPG, PNG, WebP, BMP, GIF / MP4, WebM, MOV, 3GP',
    ],
  },
  {
    title: '설정',
    items: [
      '슬라이드 간격: 3초 ~ 60초 사이로 조절합니다.',
      '전환 효과: 효과 없음 / 단일(Fade, Slide, Zoom 중 선택) / 랜덤(선택한 효과 중 무작위)',
      '테마: 시스템 설정을 따르거나 라이트/다크를 직접 고를 수 있고, 포인트 컬러 6종을 지원합니다.',
    ],
  },
  {
    title: '액자로 오래 쓰려면',
    items: [
      '태블릿을 충전기에 연결하고, 기기 설정에서 화면 잠금을 "없음"으로 바꾸면 화면이 꺼지거나 잠기지 않습니다.',
      '개발자 옵션의 "충전 중 화면 켜두기"를 켜 두면 더 안정적입니다.',
      '앨범에 사진을 추가/삭제했다면 설정 → 앨범 "변경"에서 같은 앨범을 다시 선택해 목록을 갱신하세요.',
    ],
  },
];

/** 앱 안에서 볼 수 있는 사용 설명서 */
export default function ManualModal({ visible, onClose }) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.scrim }]}>
        <View style={[styles.dialog, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>사용 설명서</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }}>
                AlbumLoop를 200% 활용하는 방법
              </Text>
            </View>
            <Button title="닫기" variant="ghost" size="sm" onPress={onClose} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {SECTIONS.map((section, i) => (
              <Card key={section.title} style={i > 0 ? { marginTop: 12 } : undefined}>
                <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>{section.title}</Text>
                {section.items.map((text) => (
                  <View key={text} style={styles.itemRow}>
                    <Text style={{ color: colors.primary, fontSize: 15, marginRight: 8 }}>•</Text>
                    <Text style={[styles.itemText, { color: colors.mutedForeground }]}>{text}</Text>
                  </View>
                ))}
              </Card>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dialog: {
    width: '62%',
    minWidth: 420,
    maxWidth: 820,
    maxHeight: '90%',
    borderRadius: RADIUS.xl + 4,
    borderWidth: 1,
    padding: 24,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  itemRow: { flexDirection: 'row', marginBottom: 6 },
  itemText: { flex: 1, fontSize: 14, lineHeight: 21 },
});
