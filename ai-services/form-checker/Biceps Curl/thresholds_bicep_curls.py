
# Get thresholds for beginner mode
def get_thresholds_beginner():

    _ANGLE_ELBOW_VERT = {
                            'NORMAL' : (0,  20),
                            'TRANS'  : (21, 45),
                            'PASS'   : (46, 80)
                       }

    thresholds = {
                    'ELBOW_VERT': _ANGLE_ELBOW_VERT,

                    'SHOULDER_THRESH'  : 50,

                    'OFFSET_THRESH'    : 35.0,
                    'INACTIVE_THRESH'  : 15.0,

                    'CNT_FRAME_THRESH' : 50
                 }

    return thresholds


# Get thresholds for pro mode
def get_thresholds_pro():

    _ANGLE_ELBOW_VERT = {
                            'NORMAL' : (0,  15),
                            'TRANS'  : (16, 40),
                            'PASS'   : (41, 80)
                       }

    thresholds = {
                    'ELBOW_VERT': _ANGLE_ELBOW_VERT,

                    'SHOULDER_THRESH'  : 45,

                    'OFFSET_THRESH'    : 35.0,
                    'INACTIVE_THRESH'  : 15.0,

                    'CNT_FRAME_THRESH' : 50
                 }

    return thresholds
