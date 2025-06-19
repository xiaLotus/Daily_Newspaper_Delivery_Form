const app = Vue.createApp({
    data() {
        return {
            formTitle: '',
            formData: {},
            tagInput: {},  
            groups: [],
            currentGroupId: null,
            activeIndex: null,
            showNewGroupModal: false,
            newGroupName: '',
            fieldNames: [
                { key: 'item1', label: '作業場別', type: 'select', options: ['F1', 'F3', 'F5']},
                { key: 'item2', label: 'Operation(選填，EX: 3390)', type: 'input'},
                { key: 'item3', label: '客戶碼', type: 'input'},
                { key: 'item4', label: 'mcid(選填‧，ex: 3390-A52)', type: 'input'},
                { key: 'item5', label: '項目 5', type: 'tags'},
                { key: 'item6', label: '項目 6', type: 'input'},
                { key: 'item7', label: '項目 7', type: 'input'},
                { key: 'item8', label: '項目 8', type: 'input'},
                { key: 'item9', label: '項目 9', type: 'input'},
                { key: 'item10', label: '項目 10', type: 'input'},
                { key: 'item11', label: '項目 11', type: 'input'},
                { key: 'item12', label: '項目 12', type: 'input'},
                { key: 'item13', label: '項目 13', type: 'input'},
                { key: 'item14', label: '項目 14', type: 'input'},
                { key: 'item15', label: '項目 15', type: 'input'},
            ]
        }
    },
    computed: {
        currentGroup() {
            return this.groups.find(g => g.id === this.currentGroupId) || { name: '載入中...', submittedData: [] };
        },
        currentSubmittedData() {
            return this.currentGroup ? this.currentGroup.submittedData : []
        }
    },
    mounted() {
        this.initializeForm()
        this.loadFromStorage()
        if (this.groups.length === 0) {
            this.createDefaultGroup()
        }
        if (this.currentGroupId === null && this.groups.length > 0) {
            this.currentGroupId = this.groups[0].id;
        }
    },
    methods: {
        initializeForm() {
            for (const field of this.fieldNames) {
                if (field.type === 'tags') {
                    this.formData[field.key] = [];
                    this.tagInput[field.key] = '';
                } else {
                    this.formData[field.key] = '';
                }
            }
        },
        createDefaultGroup() {
            const defaultGroup = { id: Date.now(), name: '預設群組', submittedData: [] }
            this.groups.push(defaultGroup)
            this.currentGroupId = defaultGroup.id
            this.saveToStorage()
        },
        createNewGroup() {
            if (!this.newGroupName.trim()) return
            const newGroup = { id: Date.now(), name: this.newGroupName.trim(), submittedData: [] }
            this.groups.push(newGroup)
            this.currentGroupId = newGroup.id
            this.saveToStorage()
            this.cancelNewGroup()
        },
        cancelNewGroup() {
            this.showNewGroupModal = false
            this.newGroupName = ''
        },
        deleteCurrentGroup() {
            if (this.groups.length <= 1) {
                alert('至少需要保留一個群組！')
                return
            }
            if (confirm(`確定要刪除群組「${this.currentGroup.name}」嗎？此操作將刪除該群組的所有資料。`)) {
                const index = this.groups.findIndex(g => g.id === this.currentGroupId)
                this.groups.splice(index, 1)
                this.currentGroupId = this.groups[0].id
                this.activeIndex = null
                this.saveToStorage()
            }
        },
        switchGroup() {
            this.activeIndex = null
            this.initializeForm()
        },
        handleSubmit() {
            const hasData = Object.values(this.formData).some(value => value.trim() !== '') || this.formTitle.trim() !== ''

            if (!hasData) {
                alert('請至少填寫一個項目或標題！')
                return
            }

            const submitData = { ...this.formData }
            submitData.timestamp = new Date().toLocaleString('zh-TW')
            submitData.title = this.formTitle.trim() || `未命名資料`

            this.currentGroup.submittedData.unshift(submitData)
            this.saveToStorage()
            this.initializeForm()
            this.formTitle = ''

            alert(`資料已提交到「${this.currentGroup.name}」！`)
        },
        clearForm() {
            this.initializeForm()
        },
        clearHistory() {
            if (confirm(`確定要清空「${this.currentGroup.name}」的所有記錄嗎？`)) {
                this.currentGroup.submittedData = []
                this.saveToStorage()
                this.activeIndex = null
            }
        },
        deleteRecord(index) {
            if (confirm(`確定要刪除第 ${index + 1} 組資料嗎？`)) {
                this.currentGroup.submittedData.splice(index, 1)
                this.saveToStorage()
                if (this.activeIndex === index) {
                    this.activeIndex = null
                } else if (this.activeIndex > index) {
                    this.activeIndex--
                }
            }
        },
        toggleDetails(index) {
            this.activeIndex = this.activeIndex === index ? null : index
        },
        saveToStorage() {
            localStorage.setItem('formGroups', JSON.stringify(this.groups))
            localStorage.setItem('currentGroupId', this.currentGroupId)
            this.saveToBackend();
        },
        loadFromStorage() {
            const storedGroups = localStorage.getItem('formGroups')
            const storedCurrentGroupId = localStorage.getItem('currentGroupId')
            if (storedGroups) {
                this.groups = JSON.parse(storedGroups)
            }
            if (this.groups.length > 0) {
                if (storedCurrentGroupId && this.groups.some(g => g.id == storedCurrentGroupId)) {
                    this.currentGroupId = parseInt(storedCurrentGroupId)
                } else {
                    this.currentGroupId = this.groups[0].id
                }
            }
        },
        addTag(fieldKey) {
            const value = this.tagInput[fieldKey].trim();
            if (value && !this.formData[fieldKey].includes(value)) {
                this.formData[fieldKey].push(value);
            }
            this.tagInput[fieldKey] = '';
        },

        removeTag(fieldKey, index) {
            this.formData[fieldKey].splice(index, 1);
        },

        onDragEnd(){
            this.saveToStorage();
        },

        saveToBackend() {
            fetch('http://127.0.0.1:5000/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ groups: this.groups })
            }).then(response => {
                if (response.ok) {
                    console.log('儲存成功')
                } else {
                    console.error('儲存失敗')
                }
            }).catch(err => console.error('網路錯誤', err))
        }
    }
})
app.component('draggable', vuedraggable)
app.mount('#app')
