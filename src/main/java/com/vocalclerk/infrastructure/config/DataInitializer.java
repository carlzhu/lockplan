package com.vocalclerk.infrastructure.config;

import com.vocalclerk.domain.entities.*;
import com.vocalclerk.infrastructure.repositories.CategoryRepository;
import com.vocalclerk.infrastructure.repositories.TaskRepository;
import com.vocalclerk.infrastructure.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;

/**
 * Component to initialize demo data when the application starts.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TaskRepository taskRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public DataInitializer(
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            TaskRepository taskRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.taskRepository = taskRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Create demo user if not exists
        if (userRepository.count() == 0) {
            createDemoData();
        }
    }

    private void createDemoData() {
        // Create demo user
        User demoUser = new User();
        demoUser.setUsername("demo");
        demoUser.setEmail("demo@example.com");
        demoUser.setPasswordHash(passwordEncoder.encode("password"));
        demoUser.setCreatedAt(LocalDateTime.now());
        demoUser.setLastLoginAt(LocalDateTime.now());

        // Create user settings
        UserSettings settings = new UserSettings();
        settings.setUser(demoUser);
        settings.setDarkMode(false);
        settings.setNotificationsEnabled(true);
        settings.setPreferredLanguage("en");
        settings.setAiModel("ollama");
        settings.setBiometricAuthEnabled(false);
        settings.setDataBackupEnabled(true);
        settings.setReminderLeadTime(15);
        
        demoUser.setSettings(settings);
        
        User savedUser = userRepository.save(demoUser);

        // Create categories
        Category workCategory = new Category();
        workCategory.setName("Work");
        workCategory.setColor("#ff7043");
        workCategory.setIcon("work");
        workCategory.setUser(savedUser);
        
        Category personalCategory = new Category();
        personalCategory.setName("Personal");
        personalCategory.setColor("#66bb6a");
        personalCategory.setIcon("person");
        personalCategory.setUser(savedUser);
        
        Category meetingCategory = new Category();
        meetingCategory.setName("Meeting");
        meetingCategory.setColor("#42a5f5");
        meetingCategory.setIcon("groups");
        meetingCategory.setUser(savedUser);
        
        Category inspirationCategory = new Category();
        inspirationCategory.setName("Inspiration");
        inspirationCategory.setColor("#ab47bc");
        inspirationCategory.setIcon("lightbulb");
        inspirationCategory.setUser(savedUser);
        
        Category generalCategory = new Category();
        generalCategory.setName("General");
        generalCategory.setColor("#808080");
        generalCategory.setIcon("folder");
        generalCategory.setUser(savedUser);
        generalCategory.setDefault(true);
        
        categoryRepository.saveAll(Arrays.asList(
                workCategory, personalCategory, meetingCategory, 
                inspirationCategory, generalCategory));

        // Create demo tasks
        Task task1 = new Task();
        task1.setTitle("Meeting with AWS");
        task1.setDescription("Discuss cloud infrastructure options");
        task1.setDueDate(LocalDateTime.now().plusHours(2));
        task1.setReminderTime(LocalDateTime.now().plusHours(1));
        task1.setPriority(TaskPriority.HIGH);
        task1.setCategory(meetingCategory);
        task1.setUser(savedUser);
        task1.setOriginalInput("明天下午1点半跟AWS有个沟通，你看要不要一起参加");
        
        Task task2 = new Task();
        task2.setTitle("Check Europe data");
        task2.setDescription("Analyze recent data package from European servers");
        task2.setDueDate(LocalDateTime.now().plusHours(4));
        task2.setReminderTime(LocalDateTime.now().plusHours(3));
        task2.setPriority(TaskPriority.MEDIUM);
        task2.setCategory(workCategory);
        task2.setUser(savedUser);
        task2.setOriginalInput("要是查最近一包数据的话，下午4点查欧洲，下午6点查澳洲。我主要怕这个点是欧洲半夜，跟澳洲中午，家里负载不会很大，可能区分度不明显");
        
        Task task3 = new Task();
        task3.setTitle("Check Australia data");
        task3.setDescription("Analyze recent data package from Australian servers");
        task3.setDueDate(LocalDateTime.now().plusHours(6));
        task3.setReminderTime(LocalDateTime.now().plusHours(5));
        task3.setPriority(TaskPriority.MEDIUM);
        task3.setCategory(workCategory);
        task3.setUser(savedUser);
        task3.setOriginalInput("要是查最近一包数据的话，下午4点查欧洲，下午6点查澳洲。我主要怕这个点是欧洲半夜，跟澳洲中午，家里负载不会很大，可能区分度不明显");
        
        Task task4 = new Task();
        task4.setTitle("New product name: NovaNote");
        task4.setDescription("Product naming idea for the new note-taking app");
        task4.setPriority(TaskPriority.LOW);
        task4.setCategory(inspirationCategory);
        task4.setUser(savedUser);
        task4.setOriginalInput("新产品名称定为NovaNote");
        
        taskRepository.saveAll(Arrays.asList(task1, task2, task3, task4));
    }
}