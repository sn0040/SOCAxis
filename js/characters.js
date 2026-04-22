/**
 * 铃兰之剑角色数据
 * 包含82个可玩角色的速度数据
 */

const CHARACTERS = [
    { id: '001', name: '麦莎', speed: 243, displayChar: '麦' },
    { id: '002', name: '拉维耶', speed: 204, displayChar: '拉' },
    { id: '003', name: '法卡尔', speed: 105, displayChar: '法' },
    { id: '004', name: '贝拉', speed: 122, displayChar: '贝' },
    { id: '005', name: '歌洛莉亚', speed: 215, displayChar: '歌' },
    { id: '006', name: '泰登', speed: 235, displayChar: '泰' },
    { id: '007', name: '伊南娜', speed: 65, displayChar: '伊' },
    { id: '008', name: '迪塔利奥', speed: 175, displayChar: '迪' },
    { id: '009', name: '马格努斯', speed: 231, displayChar: '马' },
    { id: '010', name: '泽维尔', speed: 193, displayChar: '泽' },
    { id: '011', name: '米格尔', speed: 111, displayChar: '米' },
    { id: '012', name: '科尔', speed: 163, displayChar: '科' },
    { id: '013', name: '萨曼莎', speed: 78, displayChar: '萨' },
    { id: '014', name: '列奥尼德', speed: 195, displayChar: '列' },
    { id: '015', name: '嘉西娅', speed: 176, displayChar: '嘉' },
    { id: '016', name: '古兹曼', speed: 180, displayChar: '古' },
    { id: '017', name: '莉莉薇儿', speed: 118, displayChar: '莉' },
    { id: '018', name: '诺诺薇儿', speed: 159, displayChar: '诺' },
    { id: '019', name: '伊奇', speed: 187, displayChar: '伊' },
    { id: '020', name: '内尔伽勒', speed: 232, displayChar: '内' },
    { id: '021', name: '伦伽勒', speed: 106, displayChar: '伦' },
    { id: '022', name: '艾达', speed: 93, displayChar: '艾' },
    { id: '023', name: '茉茉', speed: 132, displayChar: '茉' },
    { id: '024', name: '阿列克谢', speed: 228, displayChar: '阿' },
    { id: '025', name: '席梦娜', speed: 271, displayChar: '席' },
    { id: '026', name: '索菲亚', speed: 179, displayChar: '索' },
    { id: '027', name: '奥古斯特', speed: 209, displayChar: '奥' },
    { id: '028', name: '蔻蔻娜', speed: 221, displayChar: '蔻' },
    { id: '029', name: '阿坎贝', speed: 123, displayChar: '阿' },
    { id: '030', name: '哈斯娜', speed: 151, displayChar: '哈' },
    { id: '031', name: '霍玛', speed: 210, displayChar: '霍' },
    { id: '032', name: '卡丽丝', speed: 126, displayChar: '卡' },
    { id: '033', name: '夏可露露', speed: 164, displayChar: '夏' },
    { id: '034', name: '阿加塔', speed: 151, displayChar: '阿' },
    { id: '035', name: '塔埃尔', speed: 288, displayChar: '塔' },
    { id: '036', name: '拉维耶·初夏记忆', speed: 180, displayChar: '拉' },
    { id: '037', name: '帕米娜', speed: 198, displayChar: '帕' },
    { id: '038', name: '翠斯坦', speed: 185, displayChar: '翠' },
    { id: '039', name: '莉拉', speed: 233, displayChar: '莉' },
    { id: '040', name: '索菲亚·夏日约定', speed: 219, displayChar: '索' },
    { id: '041', name: '奇亚', speed: 187, displayChar: '奇' },
    { id: '042', name: '柯瓦雷', speed: 272, displayChar: '柯' },
    { id: '043', name: '露维塔', speed: 208, displayChar: '露' },
    { id: '044', name: '伊斯特拉', speed: 168, displayChar: '伊' },
    { id: '045', name: '芙拉维娅', speed: 224, displayChar: '芙' },
    { id: '046', name: '流星队', speed: 218, displayChar: '流' },
    { id: '047', name: '鲁特菲', speed: 167, displayChar: '鲁' },
    { id: '048', name: '爱莎', speed: 222, displayChar: '爱' },
    { id: '049', name: '阿芙拉', speed: 275, displayChar: '阿' },
    { id: '050', name: '伊南娜·铃兰之剑', speed: 216, displayChar: '伊' },
    { id: '051', name: '妮蒂娅', speed: 158, displayChar: '妮' },
    { id: '052', name: '森西', speed: 193, displayChar: '森' },
    { id: '053', name: '玛露西尔', speed: 124, displayChar: '玛' },
    { id: '054', name: '法琳', speed: 78, displayChar: '法' },
    { id: '055', name: '黎各', speed: 220, displayChar: '黎' },
    { id: '056', name: '柯莱丹萨', speed: 76, displayChar: '柯' },
    { id: '057', name: '帕西法尔', speed: 172, displayChar: '帕' },
    { id: '058', name: '萨曼莎·不灭微光', speed: 152, displayChar: '萨' },
    { id: '059', name: '伊瑟琳德', speed: 184, displayChar: '伊' },
    { id: '060', name: '全装甲麦莎', speed: 243, displayChar: '全' },
    { id: '061', name: '卡姆洛特', speed: 211, displayChar: '卡' },
    { id: '062', name: '法卡尔·卫国之箭', speed: 205, displayChar: '法' },
    { id: '063', name: '伦伽勒·传承之枪', speed: 198, displayChar: '伦' },
    { id: '064', name: '露卡玛尔', speed: 190, displayChar: '露' },
    { id: '065', name: '波奇茸茸', speed: 197, displayChar: '波' },
    { id: '066', name: '沙姆斯', speed: 209, displayChar: '沙' },
    { id: '067', name: '克拉拉', speed: 235, displayChar: '克' },
    { id: '068', name: '赛琳娜', speed: 149, displayChar: '赛' },
    { id: '069', name: '叶迦内', speed: 161, displayChar: '叶' },
    { id: '070', name: '赫砂', speed: 231, displayChar: '赫' },
    { id: '071', name: '沙娜姿', speed: 127, displayChar: '沙' },
    { id: '072', name: '基安希尔', speed: 203, displayChar: '基' },
    { id: '073', name: '希里', speed: 152, displayChar: '希' },
    { id: '074', name: '杰洛特', speed: 152, displayChar: '杰' },
    { id: '075', name: '叶奈法', speed: 245, displayChar: '叶' },
    { id: '076', name: '特莉丝', speed: 151, displayChar: '特' },
    { id: '077', name: '安娜', speed: 208, displayChar: '安' },
    { id: '078', name: '阿列克谢·风雪孤行', speed: 228, displayChar: '阿' },
    { id: '079', name: '罗格妮达', speed: 229, displayChar: '罗' },
    { id: '080', name: '乌莉娅', speed: 166, displayChar: '乌' },
    { id: '081', name: '伊凡', speed: 180, displayChar: '伊' },
    { id: '082', name: '芬恩', speed: 234, displayChar: '芬' }
];

// 搜索角色函数
function searchCharacters(query) {
    if (!query || query.trim() === '') {
        return CHARACTERS;
    }
    query = query.toLowerCase().trim();
    return CHARACTERS.filter(char => 
        char.name.toLowerCase().includes(query) ||
        char.id.includes(query)
    );
}

// 根据ID获取角色
function getCharacterById(id) {
    return CHARACTERS.find(char => char.id === id);
}
