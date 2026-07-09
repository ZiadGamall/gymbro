
# Get thresholds for beginner mode
def get_thresholds_beginner():

    _ANGLE_ELBOW_VERT = {
                            'NORMAL' : (45, 65),
                            'TRANS'  : (25, 44),
                            'PASS'   : (5,  24)
                        }

    thresholds = {
                    'ELBOW_VERT': _ANGLE_ELBOW_VERT,

                    'SHOULDER_THRESH'  : [10, 80],
                    'ELBOW_THRESH'     : [44, 25, 5],
                    'SYNC_THRESH'      : 20,

                    'OFFSET_THRESH'    : 100.0,
                    'INACTIVE_THRESH'  : 15.0,

                    'CNT_FRAME_THRESH' : 50
                 }

    return thresholds


# Get thresholds for pro mode
def get_thresholds_pro():

    _ANGLE_ELBOW_VERT = {
                            'NORMAL' : (45, 65),
                            'TRANS'  : (25, 44),
                            'PASS'   : (5,  24)
                        }

    thresholds = {
                    'ELBOW_VERT': _ANGLE_ELBOW_VERT,

                    'SHOULDER_THRESH'  : [10, 80],
                    'ELBOW_THRESH'     : [44, 25, 5],
                    'SYNC_THRESH'      : 10,

                    'OFFSET_THRESH'    : 100.0,
                    'INACTIVE_THRESH'  : 15.0,

                    'CNT_FRAME_THRESH' : 50
                 }

    return thresholds
