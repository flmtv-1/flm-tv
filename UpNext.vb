Dim wasShown As Boolean = False
Dim lastShowIdx As Integer = -1
While True
    Try
        Dim xml As String = API.XML()
        Dim doc As New System.Xml.XmlDocument()
        doc.LoadXml(xml)
        Dim upNextTitle As String = ""
        Dim duration As Integer = 0
        Dim position As Integer = 0
        Dim activeNode As System.Xml.XmlNode = doc.SelectSingleNode("/vmix/active")
        If Not activeNode Is Nothing Then
            Dim activeNumber As String = activeNode.InnerText
            Dim inputNode As System.Xml.XmlNode = doc.SelectSingleNode("/vmix/inputs/input[@number='" & activeNumber & "']")
            If Not inputNode Is Nothing Then
                Dim durationAttr As System.Xml.XmlAttribute = inputNode.Attributes("duration")
                Dim positionAttr As System.Xml.XmlAttribute = inputNode.Attributes("position")
                If Not durationAttr Is Nothing Then Integer.TryParse(durationAttr.Value, duration)
                If Not positionAttr Is Nothing Then Integer.TryParse(positionAttr.Value, position)
                Dim typeAttr As System.Xml.XmlAttribute = inputNode.Attributes("type")
                If Not typeAttr Is Nothing AndAlso typeAttr.Value = "VideoList" Then
                    Dim idxAttr As System.Xml.XmlAttribute = inputNode.Attributes("selectedIndex")
                    If Not idxAttr Is Nothing Then
                        Dim currentIdx As Integer = 0
                        Integer.TryParse(idxAttr.Value, currentIdx)
                        If currentIdx <> lastShowIdx Then
                            wasShown = False
                            lastShowIdx = currentIdx
                            API.Function("OverlayInput3Out", Input:="Title 49- Corners Ft. MC Titler Blue.gtzip")
                        End If
                        Dim nextNode As System.Xml.XmlNode = inputNode.SelectSingleNode("list/item[" & (currentIdx + 2) & "]")
                        If Not nextNode Is Nothing Then
                            Dim nextTitleAttr As System.Xml.XmlAttribute = nextNode.Attributes("title")
                            If Not nextTitleAttr Is Nothing AndAlso nextTitleAttr.Value <> "" Then
                                upNextTitle = nextTitleAttr.Value
                            Else
                                Dim fullPath As String = nextNode.InnerText
                                Dim parts() As String = fullPath.Split("\")
                                Dim fileName As String = parts(parts.Length - 1)
                                Dim dotIdx As Integer = fileName.LastIndexOf(".")
                                If dotIdx > 0 Then fileName = fileName.Substring(0, dotIdx)
                                upNextTitle = fileName
                            End If
                            If upNextTitle.Length > 25 Then upNextTitle = upNextTitle.Substring(0, 25)
                        End If
                    End If
                End If
            End If
        End If
        If upNextTitle <> "" Then
            API.Function("SetText", Input:="Title 49- Corners Ft. MC Titler Blue.gtzip", SelectedName:="Headline.Text", Value:="Up Next: " & upNextTitle)
        End If
        If upNextTitle <> "" AndAlso duration > 0 AndAlso position > (duration / 2) AndAlso Not wasShown Then
            API.Function("OverlayInput3In", Input:="Title 49- Corners Ft. MC Titler Blue.gtzip")
            wasShown = True
        End If
    Catch ex As Exception
    End Try
    System.Threading.Thread.Sleep(1000)
End While
