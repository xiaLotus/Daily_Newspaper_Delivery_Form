const app = Vue.createApp({
    data() {
        return {
            formTitle: '',
            formData: {},
            item5Input: '',
            groups: [],
            currentGroupId: null,
            activeIndex: null,
            showNewGroupModal: false,
            newGroupName: ''
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
            for (let i = 1; i <= 15; i++) {
                if (i === 5) {
                    this.formData['item5'] = []
                } else {
                    this.formData['item' + i] = ''
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
        addItem5Tag() {
            const value = this.item5Input.trim()
            if (value && !this.formData.item5.includes(value)) {
                this.formData.item5.push(value)
            }
            this.item5Input = ''
        },

        removeItem5Tag(index) {
            this.formData.item5.splice(index, 1)
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
