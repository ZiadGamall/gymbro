import time
import cv2
import numpy as np
from collections import deque
from utils import find_angle, get_landmark_features, draw_text, draw_dotted_line


class ProcessFrameBicepCurls:
    def __init__(self, thresholds, flip_frame=False):

        self.flip_frame = flip_frame
        self.thresholds = thresholds
        self.font       = cv2.FONT_HERSHEY_SIMPLEX
        self.linetype   = cv2.LINE_AA
        self.radius     = 20

        self.COLORS = {
                        'blue'       : (0, 127, 255),
                        'red'        : (255, 50, 50),
                        'green'      : (0, 255, 127),
                        'light_green': (100, 233, 127),
                        'yellow'     : (255, 255, 0),
                        'magenta'    : (255, 0, 255),
                        'white'      : (255, 255, 255),
                        'cyan'       : (0, 255, 255),
                        'light_blue' : (102, 204, 255)
                      }

        self.dict_features = {}
        self.left_features = {
                                'shoulder': 11,
                                'elbow'   : 13,
                                'wrist'   : 15,
                                'hip'     : 23,
                                'knee'    : 25,
                                'ankle'   : 27,
                                'foot'    : 31
                             }
        self.right_features = {
                                'shoulder': 12,
                                'elbow'   : 14,
                                'wrist'   : 16,
                                'hip'     : 24,
                                'knee'    : 26,
                                'ankle'   : 28,
                                'foot'    : 32
                              }

        self.dict_features['left']  = self.left_features
        self.dict_features['right'] = self.right_features
        self.dict_features['nose']  = 0

        # Smoothing buffer for elbow angle
        self._elbow_buffer = deque(maxlen=5)

        self.state_tracker = {
            'state_seq': [],

            'start_inactive_time'      : time.perf_counter(),
            'start_inactive_time_front': time.perf_counter(),
            'INACTIVE_TIME'            : 0.0,
            'INACTIVE_TIME_FRONT'      : 0.0,

            # 0 --> Elbow swinging forward, 1 --> Incomplete curl,
            # 2 --> Lower fully,            3 --> Overextending
            'DISPLAY_TEXT' : np.full((4,), False),
            'COUNT_FRAMES' : np.zeros((4,), dtype=np.int64),

            'CURL_MORE'        : False,
            'INCORRECT_POSTURE': False,

            'prev_state': None,
            'curr_state': None,

            'CURL_COUNT'    : 0,
            'IMPROPER_CURL' : 0
        }

        self.FEEDBACK_ID_MAP = {
                                0: ('ELBOW SWINGING',  215, (0, 153, 255)),
                                1: ('INCOMPLETE CURL', 215, (0, 153, 255)),
                                2: ('LOWER FULLY',     170, (255, 80, 80)),
                                3: ('OVEREXTENDING',   125, (255, 80, 80))
                               }


    def _get_state(self, elbow_angle):
        # Angle INCREASES as arm curls up:
        # s1 = arm down (extended) → LOW angle  (0-30°)
        # s2 = mid curl            → MID angle  (31-100°)
        # s3 = fully curled        → HIGH angle (101-160°)
        elbow = None

        if self.thresholds['ELBOW_VERT']['NORMAL'][0] <= elbow_angle <= self.thresholds['ELBOW_VERT']['NORMAL'][1]:
            elbow = 1
        elif self.thresholds['ELBOW_VERT']['TRANS'][0] <= elbow_angle <= self.thresholds['ELBOW_VERT']['TRANS'][1]:
            elbow = 2
        elif self.thresholds['ELBOW_VERT']['PASS'][0] <= elbow_angle <= self.thresholds['ELBOW_VERT']['PASS'][1]:
            elbow = 3

        return f's{elbow}' if elbow else None


    def _update_state_sequence(self, state):

        if state == 's2':
            if (('s3' not in self.state_tracker['state_seq']) and (self.state_tracker['state_seq'].count('s2') == 0)) or \
                    (('s3' in self.state_tracker['state_seq']) and (self.state_tracker['state_seq'].count('s2') == 1)):
                self.state_tracker['state_seq'].append(state)

        elif state == 's3':
            if (state not in self.state_tracker['state_seq']) and 's2' in self.state_tracker['state_seq']:
                self.state_tracker['state_seq'].append(state)


    def _show_feedback(self, frame, c_frame, dict_maps, curl_more):

        if curl_more:
            draw_text(
                    frame,
                    'CURL MORE',
                    pos=(30, 80),
                    text_color=(0, 0, 0),
                    font_scale=0.6,
                    text_color_bg=(255, 255, 0)
                )

        for idx in np.where(c_frame)[0]:
            draw_text(
                    frame,
                    dict_maps[idx][0],
                    pos=(30, dict_maps[idx][1]),
                    text_color=(255, 255, 230),
                    font_scale=0.6,
                    text_color_bg=dict_maps[idx][2]
                )

        return frame


    def process(self, frame: np.array, pose):
        play_sound = None

        frame_height, frame_width, _ = frame.shape

        keypoints = pose.process(frame)

        if keypoints.pose_landmarks:
            ps_lm = keypoints.pose_landmarks

            nose_coord = get_landmark_features(ps_lm.landmark, self.dict_features, 'nose', frame_width, frame_height)
            left_shldr_coord,  left_elbow_coord,  left_wrist_coord,  left_hip_coord,  left_knee_coord,  left_ankle_coord,  left_foot_coord  = \
                get_landmark_features(ps_lm.landmark, self.dict_features, 'left',  frame_width, frame_height)
            right_shldr_coord, right_elbow_coord, right_wrist_coord, right_hip_coord, right_knee_coord, right_ankle_coord, right_foot_coord = \
                get_landmark_features(ps_lm.landmark, self.dict_features, 'right', frame_width, frame_height)

            # Side-view alignment check — same as squats
            offset_angle = find_angle(left_shldr_coord, right_shldr_coord, nose_coord)

            if offset_angle > self.thresholds['OFFSET_THRESH']:

                display_inactivity = False

                end_time = time.perf_counter()
                self.state_tracker['INACTIVE_TIME_FRONT'] += end_time - self.state_tracker['start_inactive_time_front']
                self.state_tracker['start_inactive_time_front'] = end_time

                if self.state_tracker['INACTIVE_TIME_FRONT'] >= self.thresholds['INACTIVE_THRESH']:
                    self.state_tracker['CURL_COUNT']    = 0
                    self.state_tracker['IMPROPER_CURL'] = 0
                    display_inactivity = True

                cv2.circle(frame, nose_coord,        7, self.COLORS['white'],   -1)
                cv2.circle(frame, left_shldr_coord,  7, self.COLORS['yellow'],  -1)
                cv2.circle(frame, right_shldr_coord, 7, self.COLORS['magenta'], -1)

                if self.flip_frame:
                    frame = cv2.flip(frame, 1)

                if display_inactivity:
                    play_sound = 'reset_counters'
                    self.state_tracker['INACTIVE_TIME_FRONT'] = 0.0
                    self.state_tracker['start_inactive_time_front'] = time.perf_counter()

                draw_text(frame, "CORRECT: "   + str(self.state_tracker['CURL_COUNT']),
                    pos=(int(frame_width * 0.68), 30), text_color=(255,255,230), font_scale=0.7, text_color_bg=(18,185,0))
                draw_text(frame, "INCORRECT: " + str(self.state_tracker['IMPROPER_CURL']),
                    pos=(int(frame_width * 0.68), 80), text_color=(255,255,230), font_scale=0.7, text_color_bg=(221,0,0))
                draw_text(frame, 'CAMERA NOT ALIGNED PROPERLY!!!',
                    pos=(30, frame_height - 60), text_color=(255,255,230), font_scale=0.65, text_color_bg=(255,153,0))
                draw_text(frame, 'OFFSET ANGLE: ' + str(offset_angle),
                    pos=(30, frame_height - 30), text_color=(255,255,230), font_scale=0.65, text_color_bg=(255,153,0))

                self.state_tracker['start_inactive_time'] = time.perf_counter()
                self.state_tracker['INACTIVE_TIME']       = 0.0
                self.state_tracker['prev_state']          = None
                self.state_tracker['curr_state']          = None

            # Camera aligned — person is sideways, process normally.
            else:

                self.state_tracker['INACTIVE_TIME_FRONT'] = 0.0
                self.state_tracker['start_inactive_time_front'] = time.perf_counter()

                # Pick the more visible side — same logic as squats
                dist_l_sh_hip = abs(left_foot_coord[1]  - left_shldr_coord[1])
                dist_r_sh_hip = abs(right_foot_coord[1] - right_shldr_coord[1])

                if dist_l_sh_hip > dist_r_sh_hip:
                    shldr_coord = left_shldr_coord
                    elbow_coord = left_elbow_coord
                    wrist_coord = left_wrist_coord
                    hip_coord   = left_hip_coord
                    multiplier  = -1
                else:
                    shldr_coord = right_shldr_coord
                    elbow_coord = right_elbow_coord
                    wrist_coord = right_wrist_coord
                    hip_coord   = right_hip_coord
                    multiplier  = 1

                # ------------------- Angle calculations -------------------

                # Elbow angle: shoulder -> elbow -> wrist
                raw_elbow_angle = find_angle(shldr_coord, elbow_coord, wrist_coord)

                # Smooth over 5 frames
                self._elbow_buffer.append(raw_elbow_angle)
                elbow_angle = int(np.mean(self._elbow_buffer))

                # Elbow swing check — elbow->shoulder->hip angle at shoulder
                # small = elbow close to torso (good), large = elbow swinging (bad)
                shoulder_angle = find_angle(elbow_coord, shldr_coord, hip_coord)

                # -----------------------------------------------------------

                # Draw arc at elbow
                cv2.ellipse(frame, elbow_coord, (20, 20), angle=0,
                            startAngle=0, endAngle=multiplier * elbow_angle,
                            color=self.COLORS['white'], thickness=3, lineType=self.linetype)

                draw_dotted_line(frame, elbow_coord, start=elbow_coord[1] - 50, end=elbow_coord[1] + 20, line_color=self.COLORS['blue'])

                # Join landmarks
                cv2.line(frame, shldr_coord, elbow_coord, self.COLORS['light_blue'], 4, lineType=self.linetype)
                cv2.line(frame, elbow_coord, wrist_coord, self.COLORS['light_blue'], 4, lineType=self.linetype)
                cv2.line(frame, shldr_coord, hip_coord,   self.COLORS['light_blue'], 4, lineType=self.linetype)

                # Plot landmark points
                for pt in [shldr_coord, elbow_coord, wrist_coord, hip_coord]:
                    cv2.circle(frame, pt, 7, self.COLORS['yellow'], -1, lineType=self.linetype)

                current_state = self._get_state(elbow_angle)
                self.state_tracker['curr_state'] = current_state
                self._update_state_sequence(current_state)


                # -------------------------------------- COMPUTE COUNTERS --------------------------------------

                if current_state == 's1':

                    if len(self._elbow_buffer) == self._elbow_buffer.maxlen:

                        if len(self.state_tracker['state_seq']) == 3 and not self.state_tracker['INCORRECT_POSTURE']:
                            self.state_tracker['CURL_COUNT'] += 1
                            play_sound = str(self.state_tracker['CURL_COUNT'])

                        elif 's2' in self.state_tracker['state_seq'] and len(self.state_tracker['state_seq']) == 1:
                            self.state_tracker['IMPROPER_CURL'] += 1
                            play_sound = 'incorrect'

                        elif self.state_tracker['INCORRECT_POSTURE']:
                            self.state_tracker['IMPROPER_CURL'] += 1
                            play_sound = 'incorrect'

                    self.state_tracker['state_seq']         = []
                    self.state_tracker['INCORRECT_POSTURE'] = False

                # ----------------------------------------------------------------------------------------------------


                # -------------------------------------- PERFORM FEEDBACK ACTIONS --------------------------------------

                else:
                    # Elbow swinging forward — shoulder angle too large
                    if shoulder_angle > self.thresholds['SHOULDER_THRESH']:
                        self.state_tracker['DISPLAY_TEXT'][0] = True
                        self.state_tracker['INCORRECT_POSTURE'] = True

                    # Mid curl but not reaching s3 — prompt to curl more
                    if self.thresholds['ELBOW_VERT']['TRANS'][0] <= elbow_angle <= self.thresholds['ELBOW_VERT']['TRANS'][1] and \
                       self.state_tracker['state_seq'].count('s2') == 1:
                        self.state_tracker['CURL_MORE'] = True

                    # Angle above safe ceiling
                    elif elbow_angle > self.thresholds['ELBOW_VERT']['PASS'][1]:
                        self.state_tracker['DISPLAY_TEXT'][3] = True
                        self.state_tracker['INCORRECT_POSTURE'] = True

                # ----------------------------------------------------------------------------------------------------


                # ----------------------------------- COMPUTE INACTIVITY ---------------------------------------------

                display_inactivity = False

                if self.state_tracker['curr_state'] == self.state_tracker['prev_state']:
                    end_time = time.perf_counter()
                    self.state_tracker['INACTIVE_TIME'] += end_time - self.state_tracker['start_inactive_time']
                    self.state_tracker['start_inactive_time'] = end_time

                    if self.state_tracker['INACTIVE_TIME'] >= self.thresholds['INACTIVE_THRESH']:
                        self.state_tracker['CURL_COUNT']    = 0
                        self.state_tracker['IMPROPER_CURL'] = 0
                        display_inactivity = True
                else:
                    self.state_tracker['start_inactive_time'] = time.perf_counter()
                    self.state_tracker['INACTIVE_TIME']       = 0.0

                # -------------------------------------------------------------------------------------------------------

                elbow_text_x = elbow_coord[0] + 15

                if self.flip_frame:
                    frame = cv2.flip(frame, 1)
                    elbow_text_x = frame_width - elbow_coord[0] + 15

                if 's3' in self.state_tracker['state_seq'] or current_state == 's1':
                    self.state_tracker['CURL_MORE'] = False

                self.state_tracker['COUNT_FRAMES'][self.state_tracker['DISPLAY_TEXT']] += 1

                frame = self._show_feedback(frame, self.state_tracker['COUNT_FRAMES'], self.FEEDBACK_ID_MAP, self.state_tracker['CURL_MORE'])

                if display_inactivity:
                    play_sound = 'reset_counters'
                    self.state_tracker['start_inactive_time'] = time.perf_counter()
                    self.state_tracker['INACTIVE_TIME']       = 0.0

                cv2.putText(frame, str(elbow_angle), (elbow_text_x, elbow_coord[1] + 10), self.font, 0.6, self.COLORS['light_green'], 2, lineType=self.linetype)

                draw_text(frame, "CORRECT: "   + str(self.state_tracker['CURL_COUNT']),
                    pos=(int(frame_width * 0.68), 30), text_color=(255,255,230), font_scale=0.7, text_color_bg=(18,185,0))
                draw_text(frame, "INCORRECT: " + str(self.state_tracker['IMPROPER_CURL']),
                    pos=(int(frame_width * 0.68), 80), text_color=(255,255,230), font_scale=0.7, text_color_bg=(221,0,0))

                self.state_tracker['DISPLAY_TEXT'][self.state_tracker['COUNT_FRAMES'] > self.thresholds['CNT_FRAME_THRESH']] = False
                self.state_tracker['COUNT_FRAMES'][self.state_tracker['COUNT_FRAMES'] > self.thresholds['CNT_FRAME_THRESH']] = 0
                self.state_tracker['prev_state'] = current_state


        else:

            if self.flip_frame:
                frame = cv2.flip(frame, 1)

            end_time = time.perf_counter()
            self.state_tracker['INACTIVE_TIME'] += end_time - self.state_tracker['start_inactive_time']

            display_inactivity = False

            if self.state_tracker['INACTIVE_TIME'] >= self.thresholds['INACTIVE_THRESH']:
                self.state_tracker['CURL_COUNT']    = 0
                self.state_tracker['IMPROPER_CURL'] = 0
                display_inactivity = True

            self.state_tracker['start_inactive_time'] = end_time

            draw_text(frame, "CORRECT: "   + str(self.state_tracker['CURL_COUNT']),
                pos=(int(frame_width * 0.68), 30), text_color=(255,255,230), font_scale=0.7, text_color_bg=(18,185,0))
            draw_text(frame, "INCORRECT: " + str(self.state_tracker['IMPROPER_CURL']),
                pos=(int(frame_width * 0.68), 80), text_color=(255,255,230), font_scale=0.7, text_color_bg=(221,0,0))

            if display_inactivity:
                play_sound = 'reset_counters'
                self.state_tracker['start_inactive_time'] = time.perf_counter()
                self.state_tracker['INACTIVE_TIME']       = 0.0

            self._elbow_buffer.clear()
            self.state_tracker['prev_state']                = None
            self.state_tracker['curr_state']                = None
            self.state_tracker['INACTIVE_TIME_FRONT']       = 0.0
            self.state_tracker['INCORRECT_POSTURE']         = False
            self.state_tracker['DISPLAY_TEXT']              = np.full((4,), False)
            self.state_tracker['COUNT_FRAMES']              = np.zeros((4,), dtype=np.int64)
            self.state_tracker['start_inactive_time_front'] = time.perf_counter()


        return frame, play_sound
